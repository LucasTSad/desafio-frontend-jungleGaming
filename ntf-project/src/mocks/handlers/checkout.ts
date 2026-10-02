import { HttpResponse } from 'msw'
import { quoteRequestSchema, walletConnectionRequestSchema } from '@/api/contracts/checkout'
import {
  createOrderRequestSchema,
  IDEMPOTENCY_HEADER,
  orderStatusSchema,
} from '@/api/contracts/orders'
import { API_PATHS } from '@/api/paths'
import { readBody, requireUser } from '../auth'
import {
  applyCheckoutScenario,
  computeQuote,
  CONNECTION_TTL_MS,
  createOrder,
  firstTimeInScenario,
  saveQuote,
  settleOrder,
  settleUserOrders,
  toOrderDto,
} from '../checkout'
import { db, mockClock } from '../db/store'
import { api, MockApiError } from '../respond'
import { isScenario } from '../scenarios'

const orderNotFound = () =>
  new MockApiError('NOT_FOUND', 'Pedido não encontrado ou pertence a outra conta.')

export const checkoutHandlers = [
  api.post(API_PATHS.quote, async ({ request }) => {
    const user = requireUser(request)
    const { network } = await readBody(request, quoteRequestSchema)
    applyCheckoutScenario(user)
    return HttpResponse.json(saveQuote(user, computeQuote(user, network)))
  }),

  api.post(API_PATHS.walletConnections, async ({ request }) => {
    const user = requireUser(request)
    const body = await readBody(request, walletConnectionRequestSchema)
    if (isScenario('carteira-recusada') && firstTimeInScenario('carteira-recusada')) {
      throw new MockApiError(
        'WALLET_REJECTED',
        'A conexão foi recusada na carteira. Aprove a solicitação ou escolha outra carteira.',
      )
    }
    const connection = {
      id: db.nextId('wc'),
      provider: body.provider,
      network: body.network,
      address: body.address,
      expiresAt: mockClock.iso(CONNECTION_TTL_MS),
    }
    db.update((draft) => {
      draft.walletConnections[connection.id] = { ...connection, userId: user.id }
    })
    return HttpResponse.json(connection, { status: 201 })
  }),

  api.delete<{ connectionId: string }>(API_PATHS.walletConnection(), ({ request, params }) => {
    const user = requireUser(request)
    db.update((draft) => {
      if (draft.walletConnections[params.connectionId]?.userId === user.id) {
        delete draft.walletConnections[params.connectionId]
      }
    })
    return new HttpResponse(null, { status: 204 })
  }),

  api.post(API_PATHS.orders, async ({ request }) => {
    const user = requireUser(request)
    const key = request.headers.get(IDEMPOTENCY_HEADER)
    if (!key) {
      throw new MockApiError('BAD_REQUEST', 'Envie a chave de idempotência do pagamento.')
    }
    const body = await readBody(request, createOrderRequestSchema)
    const { order, created } = createOrder(user, key, body)
    // "timeout-pedido": o pedido nasce, mas a primeira resposta se perde no caminho.
    if (created && isScenario('timeout-pedido') && firstTimeInScenario('timeout-pedido')) {
      return HttpResponse.error()
    }
    return HttpResponse.json(toOrderDto(order), { status: created ? 201 : 200 })
  }),

  api.get<{ orderId: string }>(API_PATHS.order(), ({ request, params }) => {
    const user = requireUser(request)
    const order = settleOrder(params.orderId)
    if (!order || order.userId !== user.id) throw orderNotFound()
    return HttpResponse.json(toOrderDto(order))
  }),

  api.get(API_PATHS.myOrders, ({ request }) => {
    const user = requireUser(request)
    settleUserOrders(user.id)
    const status = orderStatusSchema.safeParse(new URL(request.url).searchParams.get('status'))
    const items = Object.values(db.get().orders)
      .filter(
        (order) => order.userId === user.id && (!status.success || order.status === status.data),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toOrderDto)
    return HttpResponse.json({ items })
  }),
]

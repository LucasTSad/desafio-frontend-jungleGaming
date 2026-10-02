import type { z } from 'zod'
import type { CheckoutNetworkDto, QuoteDto } from '@/api/contracts/checkout'
import type { createOrderRequestSchema, OrderDto } from '@/api/contracts/orders'
import { addEth, multiplyEth } from '@/lib/eth'
import { emptyCart, toCartDto, totalsOf } from './cart'
import { updateNft } from './catalog'
import { db, mockClock } from './db/store'
import type { OrderRecord, UserRecord } from './db/types'
import { MockApiError } from './respond'
import { getScenarioActivatedAt, isScenario } from './scenarios'

const QUOTE_TTL_MS = 2 * 60_000
export const CONNECTION_TTL_MS = 10 * 60_000
/** Tempo até a "rede" confirmar ou recusar o pagamento de um pedido pendente. */
export const CONFIRMATION_DELAY_MS = 3_000

const EXPLORERS: Record<CheckoutNetworkDto, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
}

export const randomHex = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length / 2)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

/**
 * Efeitos de cenário que acontecem uma vez por ativação (ex.: a carteira recusa só a primeira
 * conexão). A marca fica no banco para valer também depois de recarregar a página.
 */
export function firstTimeInScenario(mark: string) {
  const activatedAt = getScenarioActivatedAt()
  if (db.get().scenarioMarks[mark] === activatedAt) return false
  db.update((draft) => {
    draft.scenarioMarks[mark] = activatedAt
  })
  return true
}

function cartRequest(user: UserRecord) {
  const cart = Object.values(db.get().carts).find((item) => item.userId === user.id)
  return cart ?? emptyCart(`cart_${user.id}`, user.id)
}

/** Revalida o carrinho inteiro (preço, estoque, cupom e taxa) e devolve a cotação, sem salvar. */
export function computeQuote(user: UserRecord, network: CheckoutNetworkDto): QuoteDto {
  const cart = cartRequest(user)
  const dto = toCartDto(cart)
  if (dto.lines.length === 0) {
    throw new MockApiError('BAD_REQUEST', 'Seu carrinho está vazio.')
  }
  const blocked = dto.lines.find(
    (line) => line.status?.kind === 'unavailable' || line.quantity > line.maxQuantity,
  )
  if (blocked) {
    throw new MockApiError(
      'AVAILABILITY_CONFLICT',
      `${blocked.name} (${blocked.edition.label}) não tem mais unidades suficientes. Volte ao carrinho para revisar.`,
      { details: { lineId: blocked.id, available: blocked.maxQuantity } },
    )
  }

  return {
    id: '',
    expiresAt: mockClock.iso(QUOTE_TTL_MS),
    cartVersion: cart.version,
    network,
    lines: dto.lines.map((line) => ({
      lineId: line.id,
      nftId: line.nftId,
      editionId: line.edition.id,
      name: line.name,
      artwork: line.artwork,
      tokenId: line.tokenId,
      editionLabel: line.edition.label,
      quantity: line.quantity,
      unitPriceEth: line.unitPriceEth,
      subtotalEth: multiplyEth(line.unitPriceEth, line.quantity),
    })),
    coupon: dto.coupon,
    totals: totalsOf(dto.lines, cart.couponCode, network),
  }
}

export function saveQuote(user: UserRecord, quote: QuoteDto): QuoteDto {
  const saved = { ...quote, id: db.nextId('qt') }
  db.update((draft) => {
    draft.quotes[saved.id] = { ...saved, userId: user.id, cartId: cartRequest(user).id }
  })
  return saved
}

/**
 * Cenários do checkout que mudam o carrinho entre a revisão e o pagamento: agem na segunda
 * cotação da ativação (a revalidação do "Confirmar e pagar"), nunca na primeira (a revisão).
 */
export function applyCheckoutScenario(user: UserRecord) {
  const scenario = isScenario('preco-alterado')
    ? 'preco-alterado'
    : isScenario('edicao-esgotada')
      ? 'edicao-esgotada'
      : null
  if (!scenario) return
  if (firstTimeInScenario(`${scenario}:revisao`)) return
  if (!firstTimeInScenario(`${scenario}:pagamento`)) return

  const [line] = toCartDto(cartRequest(user)).lines
  if (!line) return
  if (scenario === 'preco-alterado') {
    updateNft(line.nftId, { priceEth: addEth(line.unitPriceEth, '0.1') })
  } else {
    updateNft(line.nftId, { editions: { [line.edition.id]: 0 } })
  }
}

const sameQuote = (a: QuoteDto, b: QuoteDto) =>
  a.totals.totalEth === b.totals.totalEth &&
  a.lines.length === b.lines.length &&
  a.lines.every((line, index) => {
    const other = b.lines[index]
    return (
      other?.lineId === line.lineId &&
      other.quantity === line.quantity &&
      other.unitPriceEth === line.unitPriceEth
    )
  })

type CreateOrderBody = z.output<typeof createOrderRequestSchema>

export function toOrderDto(order: OrderRecord): OrderDto {
  const { userId: _userId, cartId: _cartId, idempotencyKey: _key, ...dto } = order
  return dto
}

/**
 * Cria o pedido de forma idempotente: a mesma chave com o mesmo corpo devolve o pedido já criado;
 * com outro corpo é recusada. A cotação precisa estar válida e ainda bater com o carrinho.
 */
export function createOrder(user: UserRecord, key: string, body: CreateOrderBody) {
  const requestHash = JSON.stringify(body)
  const scopedKey = `${user.id}:${key}`
  const existing = db.get().idempotency[scopedKey]
  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw new MockApiError(
        'IDEMPOTENCY_KEY_REUSED',
        'Esta tentativa de pagamento já foi usada com outros dados. Revise a compra novamente.',
      )
    }
    const order = db.get().orders[existing.orderId]
    if (order) return { order, created: false }
  }

  const quote = db.get().quotes[body.quoteId]
  if (!quote || quote.userId !== user.id || Date.parse(quote.expiresAt) <= mockClock.now()) {
    throw new MockApiError('QUOTE_EXPIRED', 'A cotação expirou. Revise a compra para continuar.')
  }
  const fresh = computeQuote(user, quote.network)
  if (!sameQuote(quote, fresh)) {
    throw new MockApiError(
      'QUOTE_CHANGED',
      'Preço, disponibilidade ou taxa mudaram desde a revisão.',
      { details: { quote: saveQuote(user, fresh) } },
    )
  }

  const connection = db.get().walletConnections[body.walletConnectionId]
  if (
    !connection ||
    connection.userId !== user.id ||
    Date.parse(connection.expiresAt) <= mockClock.now()
  ) {
    throw new MockApiError('VALIDATION_ERROR', 'A carteira foi desconectada. Conecte novamente.')
  }

  const now = mockClock.iso()
  const transactionHash = `0x${randomHex(64)}`
  const order: OrderRecord = {
    id: db.nextId('ord'),
    version: 1,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    network: connection.network,
    provider: connection.provider,
    walletAddress: connection.address,
    transactionHash,
    explorerUrl: `${EXPLORERS[connection.network]}${transactionHash}`,
    lines: quote.lines,
    coupon: quote.coupon,
    totals: quote.totals,
    failureReason: null,
    userId: user.id,
    cartId: quote.cartId,
    idempotencyKey: key,
  }
  db.update((draft) => {
    draft.orders[order.id] = order
    draft.idempotency[scopedKey] = { orderId: order.id, requestHash }
  })
  return { order, created: true }
}

/**
 * Resolve o pedido pendente quando o prazo da "rede" passa. Confirmado: baixa o estoque das
 * edições limitadas e tira do carrinho só o que foi comprado. Recusado: nada muda.
 */
export function settleOrder(orderId: string) {
  const order = db.get().orders[orderId]
  if (!order || order.status !== 'pending') return order
  if (Date.parse(order.createdAt) + CONFIRMATION_DELAY_MS > mockClock.now()) return order

  const refused = isScenario('pagamento-recusado')
  return db.update((draft) => {
    const target = draft.orders[orderId]!
    target.version += 1
    target.updatedAt = mockClock.iso()
    if (refused) {
      target.status = 'refused'
      target.failureReason = 'A carteira informou saldo insuficiente para cobrir o total e a taxa.'
      return target
    }

    target.status = 'confirmed'
    for (const line of target.lines) {
      const nft = draft.nfts[line.nftId]
      const available = nft?.editions[line.editionId]
      if (nft && typeof available === 'number') {
        nft.editions[line.editionId] = Math.max(0, available - line.quantity)
        nft.version += 1
      }
    }
    const cart = draft.carts[target.cartId]
    if (cart) {
      cart.lines = cart.lines
        .map((item) => {
          const bought = target.lines.find((line) => line.lineId === item.id)
          return bought ? { ...item, quantity: item.quantity - bought.quantity } : item
        })
        .filter((item) => item.quantity > 0)
      if (target.coupon && cart.couponCode === target.coupon.code) cart.couponCode = null
      cart.version += 1
    }
    return target
  })
}

export function settleUserOrders(userId: string) {
  for (const order of Object.values(db.get().orders)) {
    if (order.userId === userId && order.status === 'pending') settleOrder(order.id)
  }
}

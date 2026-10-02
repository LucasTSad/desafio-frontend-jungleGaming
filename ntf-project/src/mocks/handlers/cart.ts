import { HttpResponse } from 'msw'
import {
  addCartItemRequestSchema,
  applyCouponRequestSchema,
  type MergeCartResponse,
  mergeCartRequestSchema,
  updateCartItemRequestSchema,
} from '@/api/contracts/cart'
import { API_PATHS } from '@/api/paths'
import { readBody, requireUser } from '../auth'
import {
  availabilityConflict,
  changeCart,
  emptyCart,
  lineIdOf,
  maxQuantityOf,
  readCart,
  toCartDto,
  validateCoupon,
} from '../cart'
import { requireFixture, toSummary } from '../catalog'
import { settleUserOrders } from '../checkout'
import { db } from '../db/store'
import { api, MockApiError } from '../respond'

const lineNotFound = () => new MockApiError('NOT_FOUND', 'Este item não está mais no seu carrinho.')

export const cartHandlers = [
  // Pedidos vencidos são resolvidos antes, para o carrinho já refletir o que foi comprado.
  api.get(API_PATHS.cart, ({ request }) => {
    const cart = readCart(request)
    if (cart.userId) {
      settleUserOrders(cart.userId)
      return HttpResponse.json(toCartDto(readCart(request)))
    }
    return HttpResponse.json(toCartDto(cart))
  }),

  api.post(API_PATHS.cartItems, async ({ request }) => {
    const body = await readBody(request, addCartItemRequestSchema)
    const { priceEth } = toSummary(requireFixture(body.nftId))
    const id = lineIdOf(body.nftId, body.editionId)
    const max = maxQuantityOf(body.nftId, body.editionId)
    const inCart = readCart(request).lines.find((line) => line.id === id)?.quantity ?? 0
    if (inCart + body.quantity > max) throw availabilityConflict(max - inCart)

    const cart = changeCart(request, (draft) => {
      const line = draft.lines.find((item) => item.id === id)
      if (line) {
        line.quantity += body.quantity
        line.seenPriceEth = priceEth
      } else {
        draft.lines.push({
          id,
          nftId: body.nftId,
          editionId: body.editionId,
          quantity: body.quantity,
          seenPriceEth: priceEth,
        })
      }
    })
    return HttpResponse.json(toCartDto(cart))
  }),

  api.patch<{ lineId: string }>(API_PATHS.cartItem(), async ({ request, params }) => {
    const body = await readBody(request, updateCartItemRequestSchema)
    const line = readCart(request).lines.find((item) => item.id === params.lineId)
    if (!line) throw lineNotFound()
    if ('quantity' in body) {
      const max = maxQuantityOf(line.nftId, line.editionId)
      if (body.quantity > max) throw availabilityConflict(max - line.quantity)
    }
    const { priceEth } = toSummary(requireFixture(line.nftId))

    const cart = changeCart(request, (draft) => {
      const target = draft.lines.find((item) => item.id === params.lineId)
      if (!target) return
      if ('quantity' in body) target.quantity = body.quantity
      else target.seenPriceEth = priceEth
    })
    return HttpResponse.json(toCartDto(cart))
  }),

  // Remover é idempotente: um item que já saiu devolve o carrinho como está.
  api.delete<{ lineId: string }>(API_PATHS.cartItem(), ({ request, params }) => {
    const cart = changeCart(request, (draft) => {
      draft.lines = draft.lines.filter((item) => item.id !== params.lineId)
    })
    return HttpResponse.json(toCartDto(cart))
  }),

  api.put(API_PATHS.cartCoupon, async ({ request }) => {
    const { code } = await readBody(request, applyCouponRequestSchema)
    const coupon = validateCoupon(code)
    const cart = changeCart(request, (draft) => {
      draft.couponCode = coupon.code
    })
    return HttpResponse.json(toCartDto(cart))
  }),

  api.delete(API_PATHS.cartCoupon, ({ request }) => {
    const cart = changeCart(request, (draft) => {
      draft.couponCode = null
    })
    return HttpResponse.json(toCartDto(cart))
  }),

  /**
   * Junta o carrinho do visitante ao da conta: soma as quantidades, limita pelo disponível e
   * informa o que precisou ser ajustado. O carrinho do visitante deixa de existir.
   */
  api.post(API_PATHS.cartMerge, async ({ request }) => {
    const user = requireUser(request)
    const { guestCartId } = await readBody(request, mergeCartRequestSchema)
    const guestKey = `guest_${guestCartId}`
    const guest = db.get().carts[guestKey]
    const adjustments: MergeCartResponse['adjustments'] = []

    const cart = db.update((draft) => {
      const existing = Object.values(draft.carts).find((item) => item.userId === user.id)
      const target = existing ?? emptyCart(`cart_${user.id}`, user.id)
      draft.carts[target.id] = target
      for (const line of guest?.lines ?? []) {
        const current = target.lines.find((item) => item.id === line.id)
        const requested = (current?.quantity ?? 0) + line.quantity
        const kept = Math.min(requested, maxQuantityOf(line.nftId, line.editionId))
        if (kept < requested) {
          adjustments.push({ nftId: line.nftId, editionId: line.editionId, requested, kept })
        }
        if (current) current.quantity = kept
        else if (kept > 0) target.lines.push({ ...line, quantity: kept })
        if (current && kept === 0) target.lines = target.lines.filter((item) => item !== current)
      }
      target.couponCode ??= guest?.couponCode ?? null
      if (guest && guest.lines.length > 0) target.version += 1
      delete draft.carts[guestKey]
      return target
    })

    return HttpResponse.json({ cart: toCartDto(cart), adjustments })
  }),
]

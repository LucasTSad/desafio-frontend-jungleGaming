import type { CartDto, CartLineDto } from '@/api/contracts/cart'
import { CART_ID_HEADER } from '@/api/contracts/cart'
import type { EditionIdDto } from '@/api/contracts/nfts'
import { addEth, compareEth, multiplyEth, percentOfEth, subtractEth } from '@/lib/eth'
import { requireUser } from './auth'
import { findFixture, toSummary } from './catalog'
import { db, mockClock } from './db/store'
import type { CartRecord, DbState } from './db/types'
import { detailContentOf, EDITION_LABELS, MAX_PER_ORDER } from './fixtures/nfts'
import { COUPON_FIXTURES, NETWORK_FEE_ETH } from './fixtures/users'
import { MockApiError } from './respond'
import { isScenario } from './scenarios'

const GUEST_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

export const lineIdOf = (nftId: string, editionId: EditionIdDto) => `${nftId}:${editionId}`

/** Carrinho de quem fez a requisição: o da conta (token) ou o do visitante (`X-Cart-Id`). */
export function cartOwner(request: Request): { cartId: string; userId: string | null } {
  if (request.headers.has('Authorization')) {
    const user = requireUser(request)
    const existing = Object.values(db.get().carts).find((cart) => cart.userId === user.id)
    return { cartId: existing?.id ?? `cart_${user.id}`, userId: user.id }
  }
  const guestId = request.headers.get(CART_ID_HEADER)
  if (!guestId || !GUEST_ID_PATTERN.test(guestId)) {
    throw new MockApiError('BAD_REQUEST', 'Carrinho do visitante não identificado.')
  }
  return { cartId: `guest_${guestId}`, userId: null }
}

export function emptyCart(cartId: string, userId: string | null): CartRecord {
  return { id: cartId, userId, version: 0, lines: [], couponCode: null }
}

export function readCart(request: Request) {
  const { cartId, userId } = cartOwner(request)
  return db.get().carts[cartId] ?? emptyCart(cartId, userId)
}

/** Aplica a mudança no carrinho de quem fez a requisição e sobe a versão. */
export function changeCart(request: Request, change: (cart: CartRecord, draft: DbState) => void) {
  const { cartId, userId } = cartOwner(request)
  return db.update((draft) => {
    const cart = (draft.carts[cartId] ??= emptyCart(cartId, userId))
    change(cart, draft)
    cart.version += 1
    return cart
  })
}

/** Quantas unidades ainda cabem na linha: o menor entre o estoque da edição e o limite por pedido. */
export function maxQuantityOf(nftId: string, editionId: EditionIdDto) {
  const fixture = findFixture(nftId)
  if (!fixture) return 0
  const available = (db.get().nfts[nftId]?.editions ?? fixture.editions)[editionId]
  return available === null ? MAX_PER_ORDER : Math.min(available, MAX_PER_ORDER)
}

export function availabilityConflict(remaining: number) {
  const message =
    remaining <= 0
      ? 'Esta edição não tem mais unidades disponíveis para o seu carrinho.'
      : `Só é possível adicionar mais ${remaining} ${remaining === 1 ? 'unidade' : 'unidades'} desta edição.`
  return new MockApiError('AVAILABILITY_CONFLICT', message, {
    details: { available: Math.max(remaining, 0) },
  })
}

function toLineDto(line: CartRecord['lines'][number]): CartLineDto | null {
  const fixture = findFixture(line.nftId)
  if (!fixture) return null
  const summary = toSummary(fixture)
  const maxQuantity = maxQuantityOf(line.nftId, line.editionId)
  const status: CartLineDto['status'] =
    maxQuantity === 0
      ? { kind: 'unavailable' }
      : compareEth(line.seenPriceEth, summary.priceEth) !== 0
        ? { kind: 'price-changed', previousPriceEth: line.seenPriceEth }
        : null

  return {
    id: line.id,
    nftId: line.nftId,
    nftVersion: summary.version,
    name: summary.name,
    artwork: summary.artwork,
    tokenId: detailContentOf(fixture).tokenId,
    edition: { id: line.editionId, label: EDITION_LABELS[line.editionId] },
    quantity: line.quantity,
    maxQuantity,
    unitPriceEth: summary.priceEth,
    status,
  }
}

export function couponOf(code: string | null) {
  return COUPON_FIXTURES.find((coupon) => coupon.code === code) ?? null
}

/** Totais calculados em wei; itens indisponíveis ficam fora da conta. */
export function totalsOf(
  lines: CartLineDto[],
  couponCode: string | null,
  network: keyof typeof NETWORK_FEE_ETH = 'ethereum',
) {
  const billable = lines.filter((line) => line.status?.kind !== 'unavailable')
  const subtotalEth = addEth(
    '0',
    ...billable.map((line) => multiplyEth(line.unitPriceEth, line.quantity)),
  )
  const coupon = couponOf(couponCode)
  const discountEth = coupon ? percentOfEth(subtotalEth, coupon.basisPoints) : '0'
  const networkFeeEth = billable.length > 0 ? NETWORK_FEE_ETH[network] : '0'
  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: addEth(subtractEth(subtotalEth, discountEth), networkFeeEth),
  }
}

export function toCartDto(cart: CartRecord): CartDto {
  const lines = cart.lines.flatMap((line) => {
    const dto = toLineDto(line)
    return dto ? [dto] : []
  })
  const coupon = couponOf(cart.couponCode)
  return {
    id: cart.id,
    version: cart.version,
    lines,
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    totals: totalsOf(lines, cart.couponCode),
  }
}

/** Valida o cupom pelo relógio do mock; o cenário "cupom-expirado" recusa qualquer código. */
export function validateCoupon(code: string) {
  const normalized = code.trim().toUpperCase()
  const coupon = couponOf(normalized)
  if (!coupon) {
    const message = 'Cupom inválido. Confira o código e tente novamente.'
    throw new MockApiError('COUPON_INVALID', message, { fields: { code: message } })
  }
  if (isScenario('cupom-expirado') || Date.parse(coupon.expiresAt) < mockClock.now()) {
    const message = 'Este cupom expirou e não pode mais ser usado.'
    throw new MockApiError('COUPON_EXPIRED', message, { fields: { code: message } })
  }
  return coupon
}

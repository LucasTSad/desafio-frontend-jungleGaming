// Carrinho de exemplo em memória, temporário até a integração com a API (MSW).
// Será substituído pelas queries/mutations do carrinho na etapa de backend.

import { useSyncExternalStore } from 'react'
import type {
  AppliedCoupon,
  CartLine,
  CartLineStatus,
  CartTotals,
  CouponResult,
} from '@/features/cart/types'
import { type EditionId, maxQuantityFor } from '@/features/nft/types'
import { previewNftDetail } from './preview-data'

/** Ative para revisar o aviso de alterações em tempo real (preço e disponibilidade). */
export const previewCartHasChanges = false

const NETWORK_FEE_ETH = 0.016
const COUPONS: Record<string, { rate: number; description: string }> = {
  KURIO10: { rate: 0.1, description: '10% de desconto no lançamento' },
}

type StoredLine = { nftId: string; editionId: EditionId; quantity: number }
type State = { lines: StoredLine[]; couponCode?: string }

let state: State = {
  lines: [
    { nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 },
    { nftId: 'violet-nomad-314', editionId: 'aberta', quantity: 6 },
    { nftId: 'ivory-baron-088', editionId: 'aberta', quantity: 9 },
  ],
}

const listeners = new Set<() => void>()

function setState(next: State) {
  state = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const lineId = (nftId: string, editionId: EditionId) => `${nftId}:${editionId}`

const PREVIEW_CHANGES: Record<string, CartLineStatus> = {
  'violet-nomad-314:aberta': { kind: 'price-changed', previousPriceEth: 1.29 },
  'ivory-baron-088:aberta': { kind: 'unavailable' },
}

function toCartLine(line: StoredLine): CartLine | undefined {
  const nft = previewNftDetail(line.nftId)
  const edition = nft?.editions.find((item) => item.id === line.editionId)
  if (!nft || !edition) return undefined
  const id = lineId(line.nftId, line.editionId)

  return {
    id,
    nftId: nft.id,
    name: nft.name,
    artwork: nft.artwork,
    tokenId: nft.tokenId,
    edition: { id: edition.id, label: edition.label },
    unitPriceEth: nft.priceEth,
    quantity: line.quantity,
    maxQuantity: maxQuantityFor(edition),
    status: previewCartHasChanges ? PREVIEW_CHANGES[id] : undefined,
  }
}

const round = (value: number) => Math.round(value * 1e6) / 1e6

function computeTotals(lines: CartLine[], couponCode?: string): CartTotals {
  const billable = lines.filter((line) => line.status?.kind !== 'unavailable')
  const subtotalEth = round(
    billable.reduce((sum, line) => sum + line.unitPriceEth * line.quantity, 0),
  )
  const coupon = couponCode ? COUPONS[couponCode] : undefined
  const discountEth = coupon ? round(subtotalEth * coupon.rate) : 0
  const networkFeeEth = billable.length > 0 ? NETWORK_FEE_ETH : 0
  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: round(subtotalEth - discountEth + networkFeeEth),
  }
}

let snapshot: { state: State; lines: CartLine[]; totals: CartTotals; count: number } | undefined

function getSnapshot() {
  if (snapshot?.state !== state) {
    const lines = state.lines.map(toCartLine).filter((line): line is CartLine => Boolean(line))
    snapshot = {
      state,
      lines,
      totals: computeTotals(lines, state.couponCode),
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
    }
  }
  return snapshot
}

export function usePreviewCart() {
  const { lines, totals, count } = useSyncExternalStore(subscribe, getSnapshot)
  const coupon: AppliedCoupon | undefined = state.couponCode
    ? { code: state.couponCode, description: COUPONS[state.couponCode]?.description ?? '' }
    : undefined
  return { lines, totals, count, coupon }
}

export const previewCartActions = {
  add(nftId: string, editionId: EditionId, quantity: number) {
    const id = lineId(nftId, editionId)
    const existing = state.lines.find((line) => lineId(line.nftId, line.editionId) === id)
    const max = toCartLine({ nftId, editionId, quantity })?.maxQuantity ?? quantity
    setState({
      ...state,
      lines: existing
        ? state.lines.map((line) =>
            line === existing
              ? { ...line, quantity: Math.min(line.quantity + quantity, max) }
              : line,
          )
        : [...state.lines, { nftId, editionId, quantity: Math.min(quantity, max) }],
    })
  },
  setQuantity(id: string, quantity: number) {
    setState({
      ...state,
      lines: state.lines.map((line) =>
        lineId(line.nftId, line.editionId) === id ? { ...line, quantity } : line,
      ),
    })
  },
  remove(id: string) {
    setState({
      ...state,
      lines: state.lines.filter((line) => lineId(line.nftId, line.editionId) !== id),
    })
  },
  applyCoupon(code: string): CouponResult {
    const normalized = code.trim().toUpperCase()
    if (!COUPONS[normalized]) return { ok: false, message: 'Cupom inválido ou expirado.' }
    setState({ ...state, couponCode: normalized })
    return { ok: true }
  },
  removeCoupon() {
    setState({ ...state, couponCode: undefined })
  },
  /** Após a confirmação, tira do carrinho só os itens e quantidades que foram comprados. */
  removePurchased(items: { id: string; quantity: number }[]) {
    const purchased = new Map(items.map((item) => [item.id, item.quantity]))
    setState({
      couponCode: undefined,
      lines: state.lines
        .map((line) => ({
          ...line,
          quantity: line.quantity - (purchased.get(lineId(line.nftId, line.editionId)) ?? 0),
        }))
        .filter((line) => line.quantity > 0),
    })
  },
}

import type { NftArtwork } from '@/features/catalog/types'
import type { EditionId } from '@/features/nft/types'

export type CartLineStatus =
  { kind: 'price-changed'; previousPriceEth: string } | { kind: 'unavailable' }

export type CartLine = {
  id: string
  nftId: string
  name: string
  artwork: NftArtwork
  tokenId: string
  edition: { id: EditionId; label: string }
  /** Valores em ETH são strings decimais; contas usam `@/lib/eth` (wei). */
  unitPriceEth: string
  quantity: number
  maxQuantity: number
  status?: CartLineStatus
}

export type CartTotals = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export type AppliedCoupon = {
  code: string
  description: string
}

export type CouponResult = { ok: true } | { ok: false; message: string }

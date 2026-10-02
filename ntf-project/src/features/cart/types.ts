import type { NftArtwork } from '@/features/catalog/types'
import type { EditionId } from '@/features/nft/types'

export type CartLineStatus =
  { kind: 'price-changed'; previousPriceEth: number } | { kind: 'unavailable' }

export type CartLine = {
  id: string
  nftId: string
  name: string
  artwork: NftArtwork
  tokenId: string
  edition: { id: EditionId; label: string }
  unitPriceEth: number
  quantity: number
  maxQuantity: number
  status?: CartLineStatus
}

export type CartTotals = {
  subtotalEth: number
  discountEth: number
  networkFeeEth: number
  totalEth: number
}

export type AppliedCoupon = {
  code: string
  description: string
}

export type CouponResult = { ok: true } | { ok: false; message: string }

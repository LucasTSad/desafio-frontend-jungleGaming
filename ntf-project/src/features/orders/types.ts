import type { NftArtwork } from '@/features/catalog/types'
import type { CartTotals } from '@/features/cart/types'
import type { CheckoutNetwork, WalletProvider } from '@/features/checkout/types'

export type OrderStatus = 'pending' | 'confirmed' | 'refused'

export type OrderLine = {
  id: string
  name: string
  artwork: NftArtwork
  tokenId: string
  editionLabel: string
  quantity: number
  unitPriceEth: number
  subtotalEth: number
}

/** Retrato do pedido no momento da compra: o recibo não muda se o catálogo mudar depois. */
export type Order = {
  id: string
  status: OrderStatus
  createdAt: string
  transactionHash: string
  network: CheckoutNetwork
  provider: WalletProvider
  walletAddress: string
  lines: OrderLine[]
  totals: CartTotals
  failureReason?: string
}

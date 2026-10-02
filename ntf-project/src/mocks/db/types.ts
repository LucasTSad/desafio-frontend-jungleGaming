import type { WalletRecordDto } from '@/api/contracts/account'
import type { CheckoutNetworkDto, QuoteDto } from '@/api/contracts/checkout'
import type { EditionIdDto } from '@/api/contracts/nfts'
import type { OrderDto } from '@/api/contracts/orders'

export type NftState = {
  priceEth: string
  previousPriceEth: string | null
  editions: Record<EditionIdDto, number | null>
  version: number
}

export type UserRecord = {
  id: string
  username: string
  email: string
  displayName: string
  passwordSalt: string
  passwordHash: string
  avatarUrl: string | null
  ensName: string
  walletNickname: string
  profileVersion: number
  wallets: {
    principal: WalletRecordDto | null
    secundaria: WalletRecordDto | null
    secondaryIsPrincipal: boolean
  }
}

export type SessionRecord = { token: string; userId: string; createdAt: number; expiresAt: string }

export type CartLineRecord = {
  id: string
  nftId: string
  editionId: EditionIdDto
  quantity: number
  /** Preço que o usuário viu/aceitou; se o atual for diferente, a linha fica "price-changed". */
  seenPriceEth: string
}

export type CartRecord = {
  id: string
  userId: string | null
  version: number
  lines: CartLineRecord[]
  couponCode: string | null
}

export type QuoteRecord = QuoteDto & { userId: string; cartId: string }

export type WalletConnectionRecord = {
  id: string
  userId: string
  provider: OrderDto['provider']
  network: CheckoutNetworkDto
  address: string
  expiresAt: string
}

export type OrderRecord = OrderDto & {
  userId: string
  cartId: string
  idempotencyKey: string
  /** Resultado decidido na criação, pelo cenário ativo naquele momento. */
  outcome: 'confirmed' | 'refused'
}

export type IdempotencyRecord = { orderId: string; requestHash: string }

export type DbState = {
  schemaVersion: number
  seed: number
  /** Deslocamento do relógio do mock, usado para simular expiração sem esperar. */
  clockOffsetMs: number
  nfts: Record<string, NftState>
  users: Record<string, UserRecord>
  sessions: Record<string, SessionRecord>
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
  quotes: Record<string, QuoteRecord>
  walletConnections: Record<string, WalletConnectionRecord>
  orders: Record<string, OrderRecord>
  idempotency: Record<string, IdempotencyRecord>
  /** Efeitos de cenário já aplicados, com o instante de ativação do cenário em que valeram. */
  scenarioMarks: Record<string, number>
  sequence: number
}

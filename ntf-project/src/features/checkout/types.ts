import type { CartLine, CartTotals } from '@/features/cart/types'

/** Redes aceitas no pagamento: as duas são EVM, por isso o endereço segue o formato 0x. */
export const CHECKOUT_NETWORKS = [
  { value: 'ethereum', label: 'Ethereum', longLabel: 'Rede principal Ethereum' },
  { value: 'polygon', label: 'Polygon', longLabel: 'Rede Polygon' },
] as const

export const WALLET_PROVIDERS = [
  { value: 'walletconnect', label: 'WalletConnect', initial: 'W' },
  { value: 'metamask', label: 'MetaMask', initial: 'M' },
  { value: 'coinbase', label: 'Coinbase Wallet', initial: 'C' },
] as const

export type CheckoutNetwork = (typeof CHECKOUT_NETWORKS)[number]['value']
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]['value']

export const networkLabel = (network: CheckoutNetwork) =>
  CHECKOUT_NETWORKS.find((item) => item.value === network)?.label ?? network

export const providerLabel = (provider: WalletProvider) =>
  WALLET_PROVIDERS.find((item) => item.value === provider)?.label ?? provider

export type SavedWallet = {
  id: string
  label: string
  /** Endereço exibido: nome ENS quando houver, senão o endereço abreviado. */
  displayAddress: string
  address: string
  network: CheckoutNetwork
  provider: WalletProvider
}

/** Cotação usada na revisão: itens e valores que o pedido vai congelar. */
export type CheckoutQuote = {
  lines: CartLine[]
  totals: CartTotals
}

export type PaymentStep = 'connecting' | 'quoting' | 'signing'

export type PaymentResult =
  | { kind: 'placed'; orderId: string }
  | { kind: 'wallet-rejected'; message: string }
  | { kind: 'quote-changed'; quote: CheckoutQuote; message: string }
  | { kind: 'error'; message: string }

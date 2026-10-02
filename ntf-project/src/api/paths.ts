/** Caminhos da API relativos à base, usados pelo cliente Axios e pelos handlers do MSW. */
export const API_PATHS = {
  health: '/health',
  register: '/auth/register',
  login: '/auth/login',
  session: '/auth/session',
  logout: '/auth/logout',
  nfts: '/nfts',
  highlights: '/nfts/highlights',
  recommendations: '/nfts/recommendations',
  nft: (id = ':nftId') => `/nfts/${id}`,
  relatedNfts: (id = ':nftId') => `/nfts/${id}/related`,
  favorites: '/me/favorites',
  favorite: (nftId = ':nftId') => `/me/favorites/${nftId}`,
  cart: '/cart',
  cartItems: '/cart/items',
  cartItem: (lineId = ':lineId') => `/cart/items/${lineId}`,
  cartCoupon: '/cart/coupon',
  cartMerge: '/cart/merge',
  quote: '/checkout/quote',
  walletConnections: '/wallet-connections',
  walletConnection: (id = ':connectionId') => `/wallet-connections/${id}`,
  orders: '/orders',
  order: (id = ':orderId') => `/orders/${id}`,
  myOrders: '/me/orders',
  profile: '/me/profile',
  avatar: '/me/avatar',
  password: '/me/password',
  wallets: '/me/wallets',
  wallet: (slot = ':slot') => `/me/wallets/${slot}`,
} as const

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

/** Origem do Socket.IO; vazia, usa a mesma origem da página (onde o MSW intercepta a conexão). */
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin
export const SOCKET_PATH = '/socket.io'

import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutHandlers } from './checkout'
import { favoriteHandlers } from './favorites'
import { healthHandlers } from './health'
import { realtimeHandlers } from '../realtime'
import { nftHandlers } from './nfts'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...favoriteHandlers,
  ...nftHandlers,
  ...cartHandlers,
  ...checkoutHandlers,
  ...realtimeHandlers,
]

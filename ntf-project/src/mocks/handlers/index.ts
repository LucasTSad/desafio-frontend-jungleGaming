import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { favoriteHandlers } from './favorites'
import { healthHandlers } from './health'
import { nftHandlers } from './nfts'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...favoriteHandlers,
  ...nftHandlers,
]

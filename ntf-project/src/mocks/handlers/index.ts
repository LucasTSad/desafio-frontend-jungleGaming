import { accountHandlers } from './account'
import { authHandlers } from './auth'
import { healthHandlers } from './health'

export const handlers = [...healthHandlers, ...authHandlers, ...accountHandlers]

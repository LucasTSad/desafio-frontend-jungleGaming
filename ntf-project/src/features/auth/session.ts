import { queryOptions, useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import { currentSessionSchema, type User } from '@/api/contracts/auth'
import { isApiError } from '@/api/errors'
import { API_PATHS } from '@/api/paths'
import { sessionStore } from './session-store'

export const SESSION_QUERY_KEY = ['session'] as const

/** Raiz das consultas privadas (`['me', userId, ...]`), descartadas ao sair ou trocar de conta. */
export const PRIVATE_QUERY_KEY = ['me'] as const

export function isAuthError(error: unknown) {
  return isApiError(error, 'SESSION_EXPIRED') || isApiError(error, 'UNAUTHENTICATED')
}

/** Usuário da sessão atual, ou `null` para visitante. Token inválido encerra a sessão local. */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async ({ signal }): Promise<User | null> => {
      if (!sessionStore.getToken()) return null
      try {
        const { user } = await apiRequest(currentSessionSchema, {
          url: API_PATHS.session,
          signal,
        })
        return user
      } catch (error) {
        if (!isAuthError(error)) throw error
        sessionStore.end(isApiError(error, 'SESSION_EXPIRED') ? 'expired' : 'signed-out')
        return null
      }
    },
    staleTime: 5 * 60_000,
  })
}

export function useSessionUser() {
  return useQuery(sessionQueryOptions()).data ?? null
}

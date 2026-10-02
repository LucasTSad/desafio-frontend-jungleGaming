import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { configureCredentials } from '@/api/client'
import { isApiError } from '@/api/errors'
import { isAuthError, PRIVATE_QUERY_KEY, SESSION_QUERY_KEY } from '@/features/auth/api'
import { sessionStore } from '@/features/auth/session-store'
import type { AppRouter } from './router'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.'

function endOnAuthError(error: unknown) {
  if (isAuthError(error)) {
    sessionStore.end(isApiError(error, 'SESSION_EXPIRED') ? 'expired' : 'signed-out')
  }
}

/**
 * Liga a sessão ao resto do app: o Axios passa a enviar o token, qualquer 401 de sessão encerra
 * a sessão local, e cada mudança limpa os dados privados e reavalia os guards das rotas (que
 * levam para Entrar guardando o destino).
 */
export function installSessionSync(queryClient: QueryClient, router: AppRouter) {
  configureCredentials({ getToken: sessionStore.getToken, getCartId: () => null })

  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      endOnAuthError(event.action.error)
    }
  })
  queryClient.getMutationCache().subscribe((event) => {
    if (event.type === 'updated' && event.action.type === 'error') {
      endOnAuthError(event.action.error)
    }
  })

  return sessionStore.subscribe(async (change) => {
    if (change.reason === 'signed-in') return

    if (change.external) {
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    } else {
      queryClient.setQueryData(SESSION_QUERY_KEY, null)
      if (change.reason === 'expired') toast.error(SESSION_EXPIRED_MESSAGE)
    }
    // Os guards rodam antes da limpeza, para a tela privada sair antes de perder os dados.
    await router.invalidate()
    queryClient.removeQueries({ queryKey: PRIVATE_QUERY_KEY })
  })
}

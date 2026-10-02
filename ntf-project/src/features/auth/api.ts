import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, apiSend } from '@/api/client'
import {
  authResponseSchema,
  currentSessionSchema,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from '@/api/contracts/auth'
import { isApiError } from '@/api/errors'
import { API_PATHS } from '@/api/paths'
import type { SignInValues, SignUpValues } from './schemas'
import { sessionStore } from './session-store'
import type { AuthSubmitResult } from './types'

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

/** Mensagens de campo da API viram erro no campo do formulário; o resto vira alerta geral. */
export function toSubmitError<TField extends string>(
  error: unknown,
  fields: readonly TField[],
): { ok: false; message: string; field?: TField } {
  if (!isApiError(error)) {
    return { ok: false, message: 'Algo deu errado. Tente novamente.' }
  }
  const field = fields.find((name) => error.fields?.[name])
  return field
    ? { ok: false, field, message: error.fields![field]! }
    : { ok: false, message: error.message }
}

function useStartSession() {
  const queryClient = useQueryClient()
  return (response: { session: { token: string; expiresAt: string }; user: User }) => {
    queryClient.removeQueries({ queryKey: PRIVATE_QUERY_KEY })
    sessionStore.signIn(response.session)
    queryClient.setQueryData(SESSION_QUERY_KEY, response.user)
  }
}

export function useSignIn() {
  const startSession = useStartSession()
  const mutation = useMutation({
    mutationFn: (body: LoginRequest) =>
      apiRequest(authResponseSchema, { method: 'POST', url: API_PATHS.login, data: body }),
    onSuccess: startSession,
  })

  return async (values: SignInValues): Promise<AuthSubmitResult<keyof SignInValues>> => {
    try {
      const { user } = await mutation.mutateAsync(values)
      return { ok: true, displayName: user.displayName }
    } catch (error) {
      return toSubmitError(error, ['email', 'password'] as const)
    }
  }
}

export function useSignUp() {
  const startSession = useStartSession()
  const mutation = useMutation({
    mutationFn: (body: RegisterRequest) =>
      apiRequest(authResponseSchema, { method: 'POST', url: API_PATHS.register, data: body }),
    onSuccess: startSession,
  })

  return async ({
    username,
    email,
    password,
  }: SignUpValues): Promise<AuthSubmitResult<keyof SignUpValues>> => {
    try {
      const { user } = await mutation.mutateAsync({ username, email, password })
      return { ok: true, displayName: user.displayName }
    } catch (error) {
      return toSubmitError(error, ['username', 'email', 'password'] as const)
    }
  }
}

/** Encerra a sessão no servidor e localmente; a saída local acontece mesmo se a API falhar. */
export async function signOut() {
  await apiSend({ method: 'POST', url: API_PATHS.logout }).catch(() => {
    // O token local é descartado de qualquer forma; no servidor ele expira sozinho.
  })
  sessionStore.end('signed-out')
}

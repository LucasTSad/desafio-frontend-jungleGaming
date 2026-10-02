import type { QueryClient } from '@tanstack/react-query'
import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { sessionQueryOptions } from './session'

type GuardOptions = { context: { queryClient: QueryClient }; location: ParsedLocation }

/**
 * Usado no `beforeLoad` das rotas privadas: confirma a sessão (uma vez, depois vem do cache) e,
 * sem ela, leva para Entrar guardando o destino. O usuário vai para o contexto das rotas filhas.
 */
export async function requireAuth({ context, location }: GuardOptions) {
  const user = await context.queryClient.ensureQueryData(sessionQueryOptions())
  if (!user) throw redirect({ to: '/entrar', search: { redirect: location.href }, replace: true })
  return { user }
}

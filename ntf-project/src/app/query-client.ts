import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'

const MAX_QUERY_RETRIES = 2

/**
 * Consultas repetem só falhas transitórias (rede, timeout, 503), com espera crescente.
 * Erros de negócio (4xx) aparecem na hora. Mutations nunca repetem sozinhas: quem garante
 * a recuperação sem duplicar é a idempotência do pedido.
 */
export function shouldRetryQuery(failureCount: number, error: unknown) {
  return isApiError(error) && error.retryable && failureCount < MAX_QUERY_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: (attempt) => Math.min(500 * 2 ** attempt, 4_000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}

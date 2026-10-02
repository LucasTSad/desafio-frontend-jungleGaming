import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { isApiError } from '@/api/errors'
import { Button } from '@/components/ui/button'
import { StatusMessage } from './status-message'

/** Erro ao carregar os dados de uma rota, com nova tentativa sem recarregar a página. */
export function RouteError({ error }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorReset = useQueryErrorResetBoundary()

  useEffect(() => {
    queryErrorReset.reset()
  }, [queryErrorReset])

  return (
    <div className="page-container py-10">
      <StatusMessage
        role="alert"
        icon={<TriangleAlert aria-hidden="true" className="size-6" />}
        title="Não foi possível carregar esta página"
        description={
          isApiError(error) ? error.message : 'Algo deu errado. Tente novamente em instantes.'
        }
        action={<Button onClick={() => void router.invalidate()}>Tentar novamente</Button>}
      />
    </div>
  )
}

/** Mostrado só quando o carregamento da rota demora (depois de `defaultPendingMs`). */
export function RoutePending() {
  return (
    <div role="status" className="flex min-h-80 items-center justify-center gap-3 text-sm">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-brand" />
      Carregando…
    </div>
  )
}

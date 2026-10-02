import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleAlert, ReceiptText } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { StatusMessage } from '@/components/common/status-message'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { Button } from '@/components/ui/button'
import { isApiError } from '@/api/errors'
import { RoutePending } from '@/components/common/route-status'
import { requireAuth } from '@/features/auth/require-auth'
import { cartKey } from '@/features/cart/api'
import { catalogKeys } from '@/features/catalog/api'
import { orderKeys, orderQueryOptions } from '@/features/orders/api'
import { OrderView } from '@/features/orders/components/order-view'
import type { OrderStatus } from '@/features/orders/types'
import { announce } from '@/lib/announce'
import { notifyUnavailable } from '@/lib/notify-unavailable'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/pedidos/$orderId')({
  staticData: { nav: 'market', hideFooter: true },
  beforeLoad: requireAuth,
  component: OrderPage,
})

const STATUS_TITLES: Record<OrderStatus, string> = {
  pending: 'Pedido aguardando confirmação',
  confirmed: 'Pedido confirmado',
  refused: 'Pagamento recusado',
}

function OrderPage() {
  const { orderId } = Route.useParams()
  const { user } = Route.useRouteContext()
  const queryClient = useQueryClient()
  const query = useQuery(orderQueryOptions(user.id, orderId))
  const order = query.data
  const status = order?.status
  const previousStatus = useRef(status)
  const notFound = isApiError(query.error, 'NOT_FOUND')

  useDocumentTitle(status ? STATUS_TITLES[status] : notFound ? 'Pedido não encontrado' : 'Pedido')

  useEffect(() => {
    if (status && previousStatus.current && previousStatus.current !== status) {
      announce(STATUS_TITLES[status], status === 'refused' ? 'assertive' : 'polite')
    }
    // Confirmado, o carrinho perde os itens comprados e o estoque das edições diminui.
    if (status === 'confirmed' && previousStatus.current !== 'confirmed') {
      void queryClient.invalidateQueries({ queryKey: cartKey(user.id, null) })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
    }
    if (status && status !== 'pending') {
      void queryClient.invalidateQueries({ queryKey: orderKeys.pending(user.id) })
    }
    previousStatus.current = status
  }, [status, queryClient, user.id])

  if (query.isPending) return <RoutePending />

  if (query.isError && !notFound) {
    return (
      <>
        <MobileTopBar title="Pedido" titleAs="p" fallbackTo="/" />
        <div className="page-container py-10 md:py-16">
          <StatusMessage
            role="alert"
            titleAs="h1"
            icon={<CircleAlert className="size-7" aria-hidden="true" />}
            title="Não foi possível carregar o pedido"
            description="Verifique sua conexão e tente novamente."
            action={<Button onClick={() => void query.refetch()}>Tentar novamente</Button>}
          />
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <MobileTopBar title="Pedido" titleAs="p" fallbackTo="/" />
        <div className="page-container py-10 md:py-16">
          <StatusMessage
            titleAs="h1"
            icon={<ReceiptText className="size-7" aria-hidden="true" />}
            title="Pedido não encontrado"
            description="O link pode estar incompleto ou o pedido pertence a outra conta."
            action={
              <Button asChild>
                <Link to="/" hash="mercado">
                  Explorar o mercado
                </Link>
              </Button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <div className="px-4 py-8 md:py-16">
      <OrderView order={order} onViewExplorer={() => notifyUnavailable('O explorador de blocos')} />
    </div>
  )
}

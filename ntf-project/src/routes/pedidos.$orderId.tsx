import { createFileRoute, Link } from '@tanstack/react-router'
import { ReceiptText } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { StatusMessage } from '@/components/common/status-message'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { Button } from '@/components/ui/button'
import { usePreviewOrder } from '@/dev/preview-checkout'
import { getCurrentAccount } from '@/dev/preview-session'
import { requireAuth } from '@/features/auth/require-auth'
import { OrderView } from '@/features/orders/components/order-view'
import type { OrderStatus } from '@/features/orders/types'
import { announce } from '@/lib/announce'
import { notifyUnavailable } from '@/lib/notify-unavailable'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/pedidos/$orderId')({
  staticData: { nav: 'market', hideFooter: true },
  beforeLoad: ({ location }) => requireAuth(Boolean(getCurrentAccount()), location.href),
  component: OrderPage,
})

const STATUS_TITLES: Record<OrderStatus, string> = {
  pending: 'Pedido aguardando confirmação',
  confirmed: 'Pedido confirmado',
  refused: 'Pagamento recusado',
}

function OrderPage() {
  const { orderId } = Route.useParams()
  const order = usePreviewOrder(orderId)
  const status = order?.status
  const previousStatus = useRef(status)

  useDocumentTitle(status ? STATUS_TITLES[status] : 'Pedido não encontrado')

  useEffect(() => {
    if (status && previousStatus.current && previousStatus.current !== status) {
      announce(STATUS_TITLES[status], status === 'refused' ? 'assertive' : 'polite')
    }
    previousStatus.current = status
  }, [status])

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

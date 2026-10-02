import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/pedidos/$orderId')({
  staticData: { nav: 'market' },
  component: () => <PagePlaceholder title="Confirmação de pedido" />,
})

import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/conta/carteiras')({
  staticData: { nav: 'account', hideFooter: true, mobileTabBar: true },
  component: () => <PagePlaceholder title="Carteiras" />,
})

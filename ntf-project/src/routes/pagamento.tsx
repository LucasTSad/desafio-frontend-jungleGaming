import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/pagamento')({
  staticData: { nav: 'market' },
  component: () => <PagePlaceholder title="Pagamento" />,
})

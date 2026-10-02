import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/carrinho')({
  staticData: { nav: 'market' },
  component: () => <PagePlaceholder title="Carrinho de NFTs" />,
})

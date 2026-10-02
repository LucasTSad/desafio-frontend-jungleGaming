import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'

export const Route = createFileRoute('/nft/$nftId')({
  staticData: { nav: 'market' },
  component: () => <PagePlaceholder title="Detalhes do NFT" />,
})

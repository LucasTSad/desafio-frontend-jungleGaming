import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useLocation, useNavigate } from '@tanstack/react-router'
import { CircleAlert, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { StatusMessage } from '@/components/common/status-message'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { Button } from '@/components/ui/button'
import { previewCartActions } from '@/dev/preview-cart'
import { isApiError } from '@/api/errors'
import { nftDetailQueryOptions, relatedNftsQueryOptions } from '@/features/catalog/api'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import {
  NftDetailSkeleton,
  NftDetailView,
  type PurchaseSelection,
} from '@/features/nft/components/nft-detail-view'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/nft/$nftId')({
  staticData: { nav: 'market', mobileActionBar: true },
  loader: ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
    void queryClient.prefetchQuery(relatedNftsQueryOptions(params.nftId))
  },
  component: NftDetailPage,
})

function NftDetailPage() {
  const { nftId } = Route.useParams()
  const navigate = useNavigate()
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const pathname = useLocation({ select: (location) => location.pathname })
  const detail = useQuery(nftDetailQueryOptions(nftId))
  const related = useQuery(relatedNftsQueryOptions(nftId)).data ?? []
  const nft = detail.data
  const notFound = isApiError(detail.error, 'NOT_FOUND')

  useDocumentTitle(
    nft?.name ??
      (notFound ? 'NFT não encontrado' : detail.isError ? 'Erro ao carregar NFT' : 'NFT'),
  )

  if (detail.isPending) return <NftDetailSkeleton />

  if (detail.isError && !notFound) {
    return (
      <PageState>
        <StatusMessage
          role="alert"
          titleAs="h1"
          icon={<CircleAlert className="size-7" aria-hidden="true" />}
          title="Não foi possível carregar este NFT"
          description="Verifique sua conexão e tente novamente."
          action={<Button onClick={() => void detail.refetch()}>Tentar novamente</Button>}
        />
      </PageState>
    )
  }

  if (!nft) {
    return (
      <PageState>
        <StatusMessage
          titleAs="h1"
          icon={<SearchX className="size-7" aria-hidden="true" />}
          title="NFT não encontrado"
          description="Ele pode ter sido removido do mercado ou o endereço está incorreto."
          action={
            <Button asChild>
              <Link to="/" hash="mercado">
                Explorar o mercado
              </Link>
            </Button>
          }
        />
      </PageState>
    )
  }

  const addToCart = ({ editionId, quantity }: PurchaseSelection) =>
    previewCartActions.add(nft.id, editionId, quantity)

  return (
    <NftDetailView
      key={nft.id}
      nft={nft}
      reviews={nft.reviews}
      related={related}
      favoriteIds={favoriteIds}
      shareUrl={`${window.location.origin}${pathname}`}
      onToggleFavorite={toggleFavorite}
      onBuy={(selection) => {
        addToCart(selection)
        navigate({ to: '/carrinho' })
      }}
      onAddToCart={(selection) => {
        addToCart(selection)
        toast.success(`${nft.name} adicionado ao carrinho`, {
          action: { label: 'Ver carrinho', onClick: () => navigate({ to: '/carrinho' }) },
        })
      }}
    />
  )
}

function PageState({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileTopBar fallbackTo="/" />
      <div className="page-container py-10 md:py-16">{children}</div>
    </>
  )
}

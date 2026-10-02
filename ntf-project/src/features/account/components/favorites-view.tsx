import { Link } from '@tanstack/react-router'
import { CircleAlert, Heart } from 'lucide-react'
import { StatusMessage } from '@/components/common/status-message'
import { Button } from '@/components/ui/button'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import type { CatalogStatus, NftSummary } from '@/features/catalog/types'

const GRID_CLASSES = 'grid grid-cols-2 gap-x-4 gap-y-6 md:gap-x-6 lg:grid-cols-3'

type FavoritesViewProps = {
  status: CatalogStatus
  items: NftSummary[]
  favoriteIds: ReadonlySet<string>
  onToggleFavorite: (nft: NftSummary) => void
  onRetry: () => void
}

export function FavoritesView({
  status,
  items,
  favoriteIds,
  onToggleFavorite,
  onRetry,
}: FavoritesViewProps) {
  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-4">
      <div>
        <h1 id="favorites-heading" className="text-base font-bold">
          Lista de interesse
        </h1>
        {status === 'success' && items.length > 0 && (
          <p className="mt-1 text-xs text-subtle-foreground">
            {items.length} {items.length === 1 ? 'NFT salvo' : 'NFTs salvos'}. Itens removidos
            continuam aqui até você sair da página, caso queira adicioná-los de novo.
          </p>
        )}
      </div>
      <FavoritesContent
        status={status}
        items={items}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        onRetry={onRetry}
      />
    </section>
  )
}

function FavoritesContent({
  status,
  items,
  favoriteIds,
  onToggleFavorite,
  onRetry,
}: FavoritesViewProps) {
  if (status === 'loading') {
    return (
      <div className={GRID_CLASSES} role="status" aria-label="Carregando favoritos">
        {Array.from({ length: 6 }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <StatusMessage
        role="alert"
        icon={<CircleAlert className="size-7" aria-hidden="true" />}
        title="Não foi possível carregar seus favoritos"
        description="Verifique sua conexão e tente novamente."
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }

  if (items.length === 0) {
    return (
      <StatusMessage
        icon={<Heart className="size-7" aria-hidden="true" />}
        title="Sua lista de interesse está vazia"
        description="Toque no coração de um NFT para guardá-lo aqui."
        action={
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <ul className={GRID_CLASSES}>
      {items.map((nft) => (
        <li key={nft.id}>
          <NftCard
            nft={nft}
            isFavorite={favoriteIds.has(nft.id)}
            onToggleFavorite={onToggleFavorite}
            titleAs="h2"
          />
        </li>
      ))}
    </ul>
  )
}

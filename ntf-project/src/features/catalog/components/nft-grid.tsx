import { CircleAlert, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { CATALOG_PAGE_SIZE } from '../search-params'
import type { CatalogStatus, NftSummary } from '../types'
import { NftCard, NftCardSkeleton } from './nft-card'

// No mobile os itens pares descem 30px, reproduzindo a grade desencontrada do Figma
// sem mudar a ordem de leitura.
const GRID_CLASSES =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-[30px] md:grid-cols-3 md:gap-x-6 md:gap-y-14 md:pb-0 xl:gap-x-[34px] xl:gap-y-[70px] [&>*:nth-child(even)]:max-md:translate-y-[30px]'

type NftGridProps = {
  status: CatalogStatus
  items: NftSummary[]
  favoriteIds: ReadonlySet<string>
  onToggleFavorite: (nft: NftSummary) => void
  onRetry: () => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function NftGrid({
  status,
  items,
  favoriteIds,
  onToggleFavorite,
  onRetry,
  onClearFilters,
  hasActiveFilters,
}: NftGridProps) {
  if (status === 'loading') {
    return (
      <div className={GRID_CLASSES} role="status" aria-label="Carregando NFTs">
        {Array.from({ length: CATALOG_PAGE_SIZE }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <CatalogMessage
        icon={<CircleAlert className="size-7" aria-hidden="true" />}
        title="Não foi possível carregar os NFTs"
        description="Verifique sua conexão e tente novamente."
        role="alert"
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }

  if (items.length === 0) {
    return (
      <CatalogMessage
        icon={<SearchX className="size-7" aria-hidden="true" />}
        title="Nenhum NFT encontrado"
        description="Ajuste a busca ou os filtros para ver outros resultados."
        action={
          hasActiveFilters ? (
            <Button variant="outline-primary" onClick={onClearFilters}>
              Limpar filtros
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <ul className={GRID_CLASSES}>
      {items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard
            nft={nft}
            isFavorite={favoriteIds.has(nft.id)}
            onToggleFavorite={onToggleFavorite}
            priority={index < 2}
          />
        </li>
      ))}
    </ul>
  )
}

type CatalogMessageProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  role?: 'alert'
}

function CatalogMessage({ icon, title, description, action, role }: CatalogMessageProps) {
  return (
    <div
      role={role}
      className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-12 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-surface text-brand">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

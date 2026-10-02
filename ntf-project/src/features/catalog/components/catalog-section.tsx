import { SlidersHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { CatalogSearch } from '../search-params'
import type { CatalogFacets, CatalogPage, CatalogStatus, NftSummary } from '../types'
import { countActiveFilters } from '../use-catalog-search'
import { ActiveFilters } from './active-filters'
import { CatalogPagination } from './catalog-pagination'
import { CatalogSortSelect, CatalogTabs } from './catalog-toolbar'
import { FeaturedNftCard } from './featured-nft-card'
import { FiltersSheet } from './filters-sheet'
import { NftGrid } from './nft-grid'

type CatalogSectionProps = {
  search: CatalogSearch
  catalog: CatalogPage
  facets?: CatalogFacets
  featured?: NftSummary
  status: CatalogStatus
  favoriteIds: ReadonlySet<string>
  filters: ReactNode
  onToggleFavorite: (nft: NftSummary) => void
  onChange: (patch: Partial<CatalogSearch>) => void
  onClearFilters: () => void
  onRetry: () => void
}

export function CatalogSection({
  search,
  catalog,
  facets,
  featured,
  status,
  favoriteIds,
  filters,
  onToggleFavorite,
  onChange,
  onClearFilters,
  onRetry,
}: CatalogSectionProps) {
  const activeFilters = countActiveFilters(search)
  const hasActiveFilters = activeFilters > 0 || Boolean(search.q)

  return (
    <section
      id="mercado"
      aria-labelledby="catalog-title"
      className="page-container scroll-mt-4 pt-7 md:pt-0"
    >
      <h2 id="catalog-title" className="sr-only">
        Mercado
      </h2>

      <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[310px_minmax(0,1fr)] xl:gap-12">
        <aside aria-label="Filtros do catálogo" className="hidden flex-col gap-6 lg:flex">
          <div className="bg-surface px-5 pt-3.5 pb-6">{filters}</div>
          <FeaturedNftCard nft={featured} />
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <CatalogTabs
              value={search.tab ?? 'todos'}
              onChange={(tab) => onChange({ tab: tab === 'todos' ? undefined : tab })}
            />
            <div className="hidden items-center gap-5 md:flex">
              <div className="lg:hidden">
                <FiltersSheet
                  resultCount={catalog.total}
                  trigger={
                    <Button variant="outline" size="sm">
                      <SlidersHorizontal aria-hidden="true" />
                      Filtros
                      {activeFilters > 0 && (
                        <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                          {activeFilters}
                        </span>
                      )}
                    </Button>
                  }
                >
                  {filters}
                </FiltersSheet>
              </div>
              <CatalogSortSelect
                value={search.sort ?? 'recentes'}
                onChange={(sort) => onChange({ sort: sort === 'recentes' ? undefined : sort })}
              />
            </div>
          </div>

          <ActiveFilters
            search={search}
            priceBounds={facets?.priceRange}
            onChange={onChange}
            onClearAll={onClearFilters}
          />

          <p className="sr-only" aria-live="polite">
            {status === 'success'
              ? `${catalog.total} ${catalog.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`
              : ''}
          </p>

          <NftGrid
            status={status}
            items={catalog.items}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            onRetry={onRetry}
            onClearFilters={onClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {status === 'success' && (
            <CatalogPagination page={catalog.page} pageCount={catalog.pageCount} />
          )}
        </div>
      </div>
    </section>
  )
}

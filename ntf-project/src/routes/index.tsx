import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  previewCatalogFacets,
  previewCatalogPage,
  previewCatalogStatus,
  previewFavoriteIds,
  previewFeaturedNft,
  previewHeroSlides,
} from '@/dev/preview-data'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogSearchForm } from '@/features/catalog/components/catalog-search-form'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { CatalogSortSelect } from '@/features/catalog/components/catalog-toolbar'
import { FiltersSheet } from '@/features/catalog/components/filters-sheet'
import { catalogSearchSchema } from '@/features/catalog/search-params'
import type { NftSummary } from '@/features/catalog/types'
import {
  countActiveFilters,
  useCatalogSearch,
  useUpdateCatalogSearch,
} from '@/features/catalog/use-catalog-search'
import { HeroShowcase } from '@/features/home/components/hero-showcase'
import { MintJournal } from '@/features/home/components/mint-journal'
import { PromoBanners } from '@/features/home/components/promo-banners'
import { announce } from '@/lib/announce'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  staticData: { nav: 'home', mobileTabBar: true },
  component: HomePage,
})

function HomePage() {
  const search = useCatalogSearch()
  const updateSearch = useUpdateCatalogSearch()
  const catalog = useMemo(() => previewCatalogPage(search), [search])
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(previewFavoriteIds),
  )

  const toggleFavorite = (nft: NftSummary) => {
    const isFavorite = favoriteIds.has(nft.id)
    const next = new Set(favoriteIds)
    if (isFavorite) next.delete(nft.id)
    else next.add(nft.id)
    setFavoriteIds(next)
    announce(`${nft.name} ${isFavorite ? 'removido dos' : 'adicionado aos'} favoritos`)
  }

  const clearFilters = () =>
    updateSearch({
      q: undefined,
      collections: undefined,
      networks: undefined,
      priceMin: undefined,
      priceMax: undefined,
    })

  const filters = (
    <CatalogFilters facets={previewCatalogFacets} search={search} onChange={updateSearch} />
  )
  const activeFilters = countActiveFilters(search)

  return (
    <>
      <div className="page-container flex gap-2 pt-4 md:hidden">
        <CatalogSearchForm
          value={search.q ?? ''}
          onSearch={(q) => updateSearch({ q }, { scrollToResults: true })}
        />
        <FiltersSheet
          resultCount={catalog.total}
          trigger={
            <button
              type="button"
              aria-label={
                activeFilters > 0
                  ? `Filtros (${activeFilters} ${activeFilters === 1 ? 'ativo' : 'ativos'})`
                  : 'Filtros'
              }
              className="relative flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#885933,#c98449)] text-primary-foreground"
            >
              <SlidersHorizontal className="size-5" aria-hidden="true" />
              {activeFilters > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background"
                >
                  {activeFilters}
                </span>
              )}
            </button>
          }
        >
          <div className="flex flex-col gap-8">
            <CatalogSortSelect
              value={search.sort ?? 'recentes'}
              onChange={(sort) => updateSearch({ sort: sort === 'recentes' ? undefined : sort })}
            />
            {filters}
          </div>
        </FiltersSheet>
      </div>

      <HeroShowcase slides={previewHeroSlides} />

      <CatalogSection
        search={search}
        catalog={catalog}
        facets={previewCatalogFacets}
        featured={previewFeaturedNft}
        status={previewCatalogStatus}
        favoriteIds={favoriteIds}
        filters={filters}
        onToggleFavorite={toggleFavorite}
        onChange={updateSearch}
        onClearFilters={clearFilters}
        onRetry={() => window.location.reload()}
      />

      <PromoBanners />
      <MintJournal />
    </>
  )
}

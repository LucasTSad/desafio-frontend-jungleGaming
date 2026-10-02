import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import {
  catalogQueryOptions,
  highlightsQueryOptions,
  toCatalogStatus,
} from '@/features/catalog/api'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogSearchForm } from '@/features/catalog/components/catalog-search-form'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { CatalogSortSelect } from '@/features/catalog/components/catalog-toolbar'
import { FiltersSheet } from '@/features/catalog/components/filters-sheet'
import { catalogSearchSchema } from '@/features/catalog/search-params'
import {
  countActiveFilters,
  useCatalogSearch,
  useUpdateCatalogSearch,
} from '@/features/catalog/use-catalog-search'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { HeroShowcase } from '@/features/home/components/hero-showcase'
import { MintJournal } from '@/features/home/components/mint-journal'
import { PromoBanners } from '@/features/home/components/promo-banners'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  staticData: { nav: 'home', mobileTabBar: true },
  loaderDeps: ({ search }) => search,
  // Só aquece o cache (inclusive no preload ao passar o mouse); a tela mostra os próprios skeletons.
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(highlightsQueryOptions())
    void queryClient.prefetchQuery(catalogQueryOptions(deps))
  },
  component: HomePage,
})

const EMPTY_PAGE = { items: [], page: 1, pageCount: 1, total: 0, facets: undefined }

function HomePage() {
  useDocumentTitle()
  const search = useCatalogSearch()
  const updateSearch = useUpdateCatalogSearch()
  const catalogQuery = useQuery(catalogQueryOptions(search))
  const highlights = useQuery(highlightsQueryOptions()).data
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const catalog = catalogQuery.data ?? EMPTY_PAGE

  const clearFilters = () =>
    updateSearch({
      q: undefined,
      collections: undefined,
      networks: undefined,
      priceMin: undefined,
      priceMax: undefined,
    })

  const filters = <CatalogFilters facets={catalog.facets} search={search} onChange={updateSearch} />
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

      <HeroShowcase slides={highlights?.hero ?? []} />

      <CatalogSection
        search={search}
        catalog={catalog}
        facets={catalog.facets}
        featured={highlights?.featured}
        status={toCatalogStatus(catalogQuery)}
        favoriteIds={favoriteIds}
        filters={filters}
        onToggleFavorite={toggleFavorite}
        onChange={updateSearch}
        onClearFilters={clearFilters}
        onRetry={() => void catalogQuery.refetch()}
      />

      <PromoBanners />
      <MintJournal />
    </>
  )
}

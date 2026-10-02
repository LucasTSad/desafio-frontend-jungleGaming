import { X } from 'lucide-react'
import { formatEthRange } from '../format'
import {
  CATALOG_COLLECTIONS,
  CATALOG_NETWORKS,
  type CatalogSearch,
  type CollectionSlug,
  type NetworkSlug,
  parseList,
} from '../search-params'

type ActiveFiltersProps = {
  search: CatalogSearch
  priceBounds?: { min: number; max: number }
  onChange: (patch: Partial<CatalogSearch>) => void
  onClearAll: () => void
}

type Chip = { key: string; label: string; remove: Partial<CatalogSearch> }

const labelOf = (list: readonly { slug: string; label: string }[], slug: string) =>
  list.find((item) => item.slug === slug)?.label ?? slug

const without = (list: string[], value: string) =>
  list.filter((item) => item !== value).join(',') || undefined

export function ActiveFilters({ search, priceBounds, onChange, onClearAll }: ActiveFiltersProps) {
  const collections = parseList<CollectionSlug>(search.collections)
  const networks = parseList<NetworkSlug>(search.networks)

  const chips: Chip[] = [
    ...(search.q ? [{ key: 'q', label: `“${search.q}”`, remove: { q: undefined } }] : []),
    ...collections.map((slug) => ({
      key: `c-${slug}`,
      label: labelOf(CATALOG_COLLECTIONS, slug),
      remove: { collections: without(collections, slug) },
    })),
    ...networks.map((slug) => ({
      key: `n-${slug}`,
      label: labelOf(CATALOG_NETWORKS, slug),
      remove: { networks: without(networks, slug) },
    })),
    ...(search.priceMin !== undefined || search.priceMax !== undefined
      ? [
          {
            key: 'price',
            label: formatEthRange(
              search.priceMin ?? priceBounds?.min ?? 0,
              search.priceMax ?? priceBounds?.max ?? search.priceMin ?? 0,
            ),
            remove: { priceMin: undefined, priceMax: undefined },
          },
        ]
      : []),
  ]

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados" role="group">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.remove)}
          aria-label={`Remover filtro ${chip.label}`}
          className="flex h-8 items-center gap-1.5 rounded-full border border-input bg-surface px-3 text-[13px] transition-colors hover:border-primary hover:text-brand"
        >
          {chip.label}
          <X className="size-3.5" aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="h-8 px-2 text-[13px] font-semibold text-brand underline-offset-4 hover:underline"
      >
        Limpar tudo
      </button>
    </div>
  )
}

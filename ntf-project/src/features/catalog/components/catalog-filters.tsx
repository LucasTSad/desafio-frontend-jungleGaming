import { Check } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import { formatEthRange } from '../format'
import {
  CATALOG_COLLECTIONS,
  CATALOG_NETWORKS,
  type CatalogSearch,
  type CollectionSlug,
  type NetworkSlug,
  parseList,
} from '../search-params'
import type { CatalogFacets } from '../types'

type PriceRange = { min?: number; max?: number }

type CatalogFiltersProps = {
  /** Ausente até a primeira resposta da API: contagens ficam ocultas e a faixa de preço espera. */
  facets?: CatalogFacets
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
  className?: string
}

const toggle = <T extends string>(list: T[], value: T) =>
  (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]).join(',') ||
  undefined

const countOf = <T extends string>(list: { value: T; count: number }[] | undefined, value: T) =>
  list ? (list.find((item) => item.value === value)?.count ?? 0) : undefined

export function CatalogFilters({ facets, search, onChange, className }: CatalogFiltersProps) {
  const collections = parseList<CollectionSlug>(search.collections)
  const networks = parseList<NetworkSlug>(search.networks)

  return (
    <div className={cn('flex flex-col gap-[34px]', className)}>
      <FilterGroup title="Coleções">
        {CATALOG_COLLECTIONS.map(({ slug, label }) => (
          <FilterOption
            key={slug}
            label={label}
            count={countOf(facets?.collections, slug)}
            selected={collections.includes(slug)}
            onToggle={() => onChange({ collections: toggle(collections, slug) })}
            emphasizeCount
          />
        ))}
      </FilterGroup>

      {facets ? (
        <PriceRangeFilter
          key={`${search.priceMin ?? ''}-${search.priceMax ?? ''}`}
          bounds={facets.priceRange}
          value={{ min: search.priceMin, max: search.priceMax }}
          onApply={({ min, max }) => onChange({ priceMin: min, priceMax: max })}
        />
      ) : (
        <Skeleton className="h-[136px]" />
      )}

      <FilterGroup title="Rede">
        {CATALOG_NETWORKS.map(({ slug, label }) => (
          <FilterOption
            key={slug}
            label={label}
            count={countOf(facets?.networks, slug)}
            selected={networks.includes(slug)}
            onToggle={() => onChange({ networks: toggle(networks, slug) })}
          />
        ))}
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h3 id={headingId} className="text-lg font-semibold">
        {title}
      </h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  )
}

type FilterOptionProps = {
  label: string
  count?: number
  selected: boolean
  onToggle: () => void
  emphasizeCount?: boolean
}

function FilterOption({ label, count, selected, onToggle, emphasizeCount }: FilterOptionProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          'relative flex h-10 w-full items-center justify-between rounded-sm pr-3 pl-3 text-left text-[15px] transition-colors hover:text-brand',
          selected ? 'text-brand' : 'text-muted-foreground',
        )}
      >
        {selected && (
          <Check
            className="absolute top-1/2 -left-1 size-3.5 -translate-y-1/2"
            aria-hidden="true"
          />
        )}
        <span>{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              emphasizeCount && 'font-bold',
              emphasizeCount && !selected && 'text-foreground',
            )}
          >
            <span className="sr-only">, </span>({count})<span className="sr-only"> NFTs</span>
          </span>
        )}
      </button>
    </li>
  )
}

type PriceRangeFilterProps = {
  bounds: { min: number; max: number }
  value: PriceRange
  onApply: (range: PriceRange) => void
}

function PriceRangeFilter({ bounds, value, onApply }: PriceRangeFilterProps) {
  const headingId = useId()
  const [range, setRange] = useState<[number, number]>([
    value.min ?? bounds.min,
    value.max ?? bounds.max,
  ])

  const apply = () => {
    const [min, max] = range.map((value) => Math.round(value * 100) / 100) as [number, number]
    onApply({
      min: min > bounds.min ? min : undefined,
      max: max < bounds.max ? max : undefined,
    })
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-1.5">
      <h3 id={headingId} className="text-lg font-semibold">
        Faixa de preço
      </h3>
      <div className="flex flex-col gap-3 pl-3">
        <Slider
          min={bounds.min}
          max={bounds.max}
          step={0.01}
          minStepsBetweenThumbs={1}
          value={range}
          onValueChange={(next) => setRange([next[0] ?? bounds.min, next[1] ?? bounds.max])}
          thumbLabels={['Preço mínimo', 'Preço máximo']}
          className="py-1"
        />
        <p className="text-[15px]">Preço: {formatEthRange(range[0], range[1])}</p>
        <Button type="button" onClick={apply} className="h-[34px] w-fit px-3 text-[15px] font-bold">
          Aplicar
        </Button>
      </div>
    </section>
  )
}

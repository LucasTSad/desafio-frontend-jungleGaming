import { useId } from 'react'
import { cn } from 'cn'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATALOG_SORTS, CATALOG_TABS, type CatalogSort, type CatalogTab } from '../search-params'

type CatalogTabsProps = {
  value: CatalogTab
  onChange: (tab: CatalogTab) => void
  className?: string
}

export function CatalogTabs({ value, onChange, className }: CatalogTabsProps) {
  return (
    <div
      role="group"
      aria-label="Listas do catálogo"
      className={cn('flex items-center gap-2 overflow-x-auto md:gap-5', className)}
    >
      {CATALOG_TABS.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative shrink-0 pb-1 text-[13px] leading-5 whitespace-nowrap transition-colors hover:text-brand md:text-[15px]',
              active
                ? 'font-semibold text-brand after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                : 'text-foreground',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

type CatalogSortSelectProps = {
  value: CatalogSort
  onChange: (sort: CatalogSort) => void
  className?: string
}

export function CatalogSortSelect({ value, onChange, className }: CatalogSortSelectProps) {
  const labelId = useId()

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span id={labelId} className="text-[15px] whitespace-nowrap">
        Ordenar por:
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as CatalogSort)}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="h-auto border-none px-0 py-1 text-[15px] focus-visible:ring-2 [&_svg]:text-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {CATALOG_SORTS.map((sort) => (
            <SelectItem key={sort.value} value={sort.value}>
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

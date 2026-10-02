import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from 'cn'
import type { ReactNode } from 'react'

type CatalogPaginationProps = {
  page: number
  pageCount: number
}

const ITEM_CLASSES =
  'flex size-[35px] items-center justify-center rounded-sm border border-input text-base transition-colors hover:border-primary hover:text-brand'

// Mostra a primeira, a última e as vizinhas da página atual; o restante vira reticências.
function visiblePages(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b)
}

export function CatalogPagination({ page, pageCount }: CatalogPaginationProps) {
  if (pageCount <= 1) return null

  const pages =
    pageCount <= 5
      ? Array.from({ length: pageCount }, (_, i) => i + 1)
      : visiblePages(page, pageCount)

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-center md:justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <PageLink page={page - 1} label="Página anterior" className={ITEM_CLASSES}>
              <ChevronLeft className="size-4" aria-hidden="true" />
            </PageLink>
          </li>
        )}
        {pages.map((value, index) => (
          <li key={value} className="flex items-center gap-2">
            {index > 0 && value - (pages[index - 1] ?? value) > 1 && (
              <span aria-hidden="true" className="px-1 text-muted-foreground">
                …
              </span>
            )}
            {value === page ? (
              <span
                aria-current="page"
                className={cn(
                  ITEM_CLASSES,
                  'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground',
                )}
              >
                <span className="sr-only">Página </span>
                {value}
              </span>
            ) : (
              <PageLink page={value} label={`Página ${value}`} className={ITEM_CLASSES}>
                {value}
              </PageLink>
            )}
          </li>
        ))}
        {page < pageCount && (
          <li>
            <PageLink page={page + 1} label="Próxima página" className={ITEM_CLASSES}>
              <ChevronRight className="size-4" aria-hidden="true" />
            </PageLink>
          </li>
        )}
      </ul>
    </nav>
  )
}

type PageLinkProps = {
  page: number
  label: string
  className: string
  children: ReactNode
}

function PageLink({ page, label, className, children }: PageLinkProps) {
  return (
    <Link
      from="/"
      to="/"
      search={(previous) => ({ ...previous, page: page === 1 ? undefined : page })}
      hash="mercado"
      aria-label={label}
      className={className}
    >
      {children}
    </Link>
  )
}

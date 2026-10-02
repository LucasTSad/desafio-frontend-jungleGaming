import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'

type CatalogSearchFormProps = {
  value: string
  onSearch: (query: string | undefined) => void
  className?: string
}

export function CatalogSearchForm({ value, onSearch, className }: CatalogSearchFormProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Mantém o campo em sincronia quando a busca muda por fora (histórico, chips, cabeçalho).
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  return (
    <form
      role="search"
      className={cn('relative flex-1', className)}
      onSubmit={(event) => {
        event.preventDefault()
        onSearch(draft.trim() || undefined)
      }}
    >
      <label htmlFor="catalog-search" className="sr-only">
        Buscar NFTs
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-subtle-foreground"
        aria-hidden="true"
      />
      <input
        id="catalog-search"
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Explorar coleções"
        enterKeyHint="search"
        autoComplete="off"
        className="h-[42px] w-full rounded-lg bg-surface pr-10 pl-11 text-[15px] tracking-wide outline-none placeholder:text-subtle-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Limpar busca"
          onClick={() => {
            setDraft('')
            onSearch(undefined)
          }}
          className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
    </form>
  )
}

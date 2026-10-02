import { useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { CatalogSearch } from './search-params'

export function useCatalogSearch() {
  return useSearch({ from: '/' })
}

/**
 * Atualiza o estado do catálogo na URL criando uma entrada no histórico, para que voltar/avançar
 * restaure a busca. Qualquer mudança que não seja de página volta para a página 1.
 */
export function useUpdateCatalogSearch() {
  const navigate = useNavigate({ from: '/' })

  return useCallback(
    (patch: Partial<CatalogSearch>, options?: { scrollToResults?: boolean }) =>
      navigate({
        search: (previous) => ({
          ...previous,
          ...patch,
          page: 'page' in patch && patch.page !== 1 ? patch.page : undefined,
        }),
        hash: options?.scrollToResults ? 'mercado' : undefined,
        resetScroll: false,
      }),
    [navigate],
  )
}

export function countActiveFilters(search: CatalogSearch) {
  return (
    (search.collections?.split(',').length ?? 0) +
    (search.networks?.split(',').length ?? 0) +
    (search.priceMin !== undefined || search.priceMax !== undefined ? 1 : 0)
  )
}

import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import {
  highlightsSchema,
  nftDetailSchema,
  nftListSchema,
  nftPageSchema,
  type NftDetailDto,
  type NftListQuery,
  type NftPageDto,
  type NftSummaryDto,
} from '@/api/contracts/nfts'
import { API_PATHS } from '@/api/paths'
import { ethToNumber } from '@/lib/eth'
import type { NftDetail, NftReview } from '@/features/nft/types'
import { CATALOG_PAGE_SIZE, type CatalogSearch } from './search-params'
import type { CatalogFacets, CatalogPage, CatalogStatus, NftSummary } from './types'

export const catalogKeys = {
  all: ['nfts'] as const,
  list: (query: NftListQuery) => [...catalogKeys.all, 'list', query] as const,
  highlights: () => [...catalogKeys.all, 'highlights'] as const,
  detail: (id: string) => [...catalogKeys.all, 'detail', id] as const,
  related: (id: string) => [...catalogKeys.all, 'related', id] as const,
  recommendations: (exclude: string[]) => [...catalogKeys.all, 'recommendations', exclude] as const,
}

export function toNftSummary(dto: NftSummaryDto): NftSummary {
  return {
    id: dto.id,
    name: dto.name,
    artwork: dto.artwork,
    priceEth: dto.priceEth,
    previousPriceEth: dto.previousPriceEth ?? undefined,
    collection: dto.collection,
    network: dto.network,
    isRare: dto.isRare,
  }
}

function toCatalogFacets({
  collections,
  networks,
  priceRange,
}: NftPageDto['facets']): CatalogFacets {
  return {
    collections,
    networks,
    priceRange: { min: ethToNumber(priceRange.min), max: ethToNumber(priceRange.max) },
  }
}

function toNftDetail(dto: NftDetailDto): NftDetail & { reviews: NftReview[] } {
  return {
    ...toNftSummary(dto),
    tokenId: dto.tokenId,
    creator: dto.creator,
    about: dto.about,
    story: dto.story,
    networkInfo: dto.networkInfo,
    contract: dto.contract,
    royalties: dto.royalties,
    attributes: dto.attributes,
    rating: dto.rating,
    editions: dto.editions,
    gallery: dto.gallery,
    reviews: dto.reviews,
  }
}

/** Preço do controle deslizante (número) para a API, que só aceita string ETH. */
const priceParam = (value: number | undefined) =>
  value === undefined ? undefined : String(Number(value.toFixed(4)))

/** A URL do catálogo vira a consulta da API; parâmetros vazios ficam de fora da chave. */
export function toListQuery(search: CatalogSearch): NftListQuery {
  const query: NftListQuery = {
    q: search.q,
    collections: search.collections,
    networks: search.networks,
    priceMin: priceParam(search.priceMin),
    priceMax: priceParam(search.priceMax),
    tab: search.tab,
    sort: search.sort,
    page: search.page,
    pageSize: CATALOG_PAGE_SIZE,
  }
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as NftListQuery
}

/**
 * Página do catálogo. Enquanto a próxima carrega, a anterior continua na tela; a troca de filtros
 * cancela a requisição antiga pelo `signal`, então uma resposta atrasada nunca sobrescreve a atual.
 */
export function catalogQueryOptions(search: CatalogSearch) {
  const query = toListQuery(search)
  return queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) =>
      apiRequest(nftPageSchema, { url: API_PATHS.nfts, params: query, signal }),
    select: (page): CatalogPage & { facets: CatalogFacets } => ({
      items: page.items.map(toNftSummary),
      page: page.page,
      pageCount: page.pageCount,
      total: page.total,
      facets: toCatalogFacets(page.facets),
    }),
    placeholderData: keepPreviousData,
  })
}

export function highlightsQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.highlights(),
    queryFn: ({ signal }) => apiRequest(highlightsSchema, { url: API_PATHS.highlights, signal }),
    select: (data) => ({
      hero: data.hero.map(toNftSummary),
      featured: toNftSummary(data.featured),
    }),
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => apiRequest(nftDetailSchema, { url: API_PATHS.nft(id), signal }),
    select: toNftDetail,
  })
}

export function relatedNftsQueryOptions(id: string) {
  return queryOptions({
    queryKey: catalogKeys.related(id),
    queryFn: ({ signal }) => apiRequest(nftListSchema, { url: API_PATHS.relatedNfts(id), signal }),
    select: (data) => data.items.map(toNftSummary),
  })
}

export function recommendationsQueryOptions(excludeIds: string[]) {
  const exclude = [...new Set(excludeIds)].sort()
  return queryOptions({
    queryKey: catalogKeys.recommendations(exclude),
    queryFn: ({ signal }) =>
      apiRequest(nftListSchema, {
        url: API_PATHS.recommendations,
        params: exclude.length > 0 ? { exclude: exclude.join(',') } : undefined,
        signal,
      }),
    select: (data) => data.items.map(toNftSummary),
    placeholderData: keepPreviousData,
  })
}

/** Converte o estado de uma consulta no status que os componentes de lista esperam. */
export function toCatalogStatus(query: { isPending: boolean; isError: boolean }): CatalogStatus {
  if (query.isPending) return 'loading'
  return query.isError ? 'error' : 'success'
}

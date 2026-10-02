import type { CollectionSlug, NetworkSlug } from './search-params'

export type NftArtwork = {
  /** Caminho base da imagem otimizada, ex.: `/images/nfts/emerald`. */
  src: string
  alt: string
}

export type NftSummary = {
  id: string
  name: string
  artwork: NftArtwork
  priceEth: number
  previousPriceEth?: number
  collection: CollectionSlug
  network: NetworkSlug
  isRare?: boolean
}

export type CatalogPage = {
  items: NftSummary[]
  page: number
  pageCount: number
  total: number
}

export type FacetCount<T extends string> = { value: T; count: number }

export type CatalogFacets = {
  collections: FacetCount<CollectionSlug>[]
  networks: FacetCount<NetworkSlug>[]
  priceRange: { min: number; max: number }
}

export type CatalogStatus = 'loading' | 'error' | 'success'

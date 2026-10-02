import type { NftArtwork, NftSummary } from '@/features/catalog/types'

export type EditionId = '1-1' | '1-10' | '1-50' | 'aberta'

export type NftEdition = {
  id: EditionId
  label: string
  /** Quantidade ainda disponível; `null` indica edição aberta, sem limite de estoque. */
  available: number | null
}

export type NftGalleryImage = NftArtwork & {
  /** Recorte aplicado à arte para destacar um detalhe (escala e ponto focal em %). */
  focus?: { scale: number; x: number; y: number }
}

export type NftReview = {
  id: string
  author: string
  rating: number
  date: string
  comment: string
}

export type NftDetail = NftSummary & {
  tokenId: string
  creator: string
  about: string
  story: string[]
  networkInfo: string
  contract: string
  royalties: string
  attributes: string[]
  rating: { average: number; count: number }
  editions: NftEdition[]
  gallery: NftGalleryImage[]
}

/** Limite de unidades de uma mesma edição por pedido. */
export const MAX_PER_ORDER = 10

export function maxQuantityFor(edition: NftEdition) {
  return edition.available === null ? MAX_PER_ORDER : Math.min(edition.available, MAX_PER_ORDER)
}

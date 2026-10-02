import { z } from 'zod'
import {
  CATALOG_COLLECTIONS,
  CATALOG_NETWORKS,
  CATALOG_SORTS,
  CATALOG_TABS,
} from '@/features/catalog/search-params'
import { artworkSchema, ethAmount } from './common'

const slugs = <T extends readonly { slug: string }[]>(items: T) =>
  items.map((item) => item.slug) as [T[number]['slug'], ...T[number]['slug'][]]
const values = <T extends readonly { value: string }[]>(items: T) =>
  items.map((item) => item.value) as [T[number]['value'], ...T[number]['value'][]]

export const collectionSchema = z.enum(slugs(CATALOG_COLLECTIONS))
export const networkSchema = z.enum(slugs(CATALOG_NETWORKS))
export const editionIdSchema = z.enum(['1-1', '1-10', '1-50', 'aberta'])

export const nftSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  artwork: artworkSchema,
  priceEth: ethAmount,
  previousPriceEth: ethAmount.nullable(),
  collection: collectionSchema,
  network: networkSchema,
  isRare: z.boolean(),
  version: z.number().int().nonnegative(),
})

export const nftPageSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
  pageCount: z.number().int().min(1),
  facets: z.object({
    collections: z.array(z.object({ value: collectionSchema, count: z.number().int() })),
    networks: z.array(z.object({ value: networkSchema, count: z.number().int() })),
    priceRange: z.object({ min: ethAmount, max: ethAmount }),
  }),
})

/** Parâmetros da listagem: os mesmos da URL do catálogo, com listas separadas por vírgula. */
export const nftListQuerySchema = z.object({
  q: z.string().trim().max(80).optional(),
  collections: z.string().optional(),
  networks: z.string().optional(),
  priceMin: ethAmount.optional(),
  priceMax: ethAmount.optional(),
  tab: z.enum(values(CATALOG_TABS)).optional(),
  sort: z.enum(values(CATALOG_SORTS)).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(48).optional(),
})

export const nftEditionSchema = z.object({
  id: editionIdSchema,
  label: z.string(),
  /** `null` indica edição aberta, sem limite de estoque. */
  available: z.number().int().nonnegative().nullable(),
})

export const nftReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().min(1).max(5),
  date: z.string(),
  comment: z.string(),
})

export const nftDetailSchema = nftSummarySchema.extend({
  tokenId: z.string(),
  creator: z.string(),
  about: z.string(),
  story: z.array(z.string()),
  networkInfo: z.string(),
  contract: z.string(),
  royalties: z.string(),
  attributes: z.array(z.string()),
  rating: z.object({ average: z.number(), count: z.number().int() }),
  reviews: z.array(nftReviewSchema),
  editions: z.array(nftEditionSchema),
  gallery: z.array(
    artworkSchema.extend({
      focus: z.object({ scale: z.number(), x: z.number(), y: z.number() }).optional(),
    }),
  ),
  maxPerOrder: z.number().int().min(1),
})

export const highlightsSchema = z.object({
  hero: z.array(nftSummarySchema),
  featured: nftSummarySchema,
})

/** Listas curtas: "Mais desta coleção" no detalhe e "Colecionadores também viram" no carrinho. */
export const nftListSchema = z.object({ items: z.array(nftSummarySchema) })

export type NftSummaryDto = z.infer<typeof nftSummarySchema>
export type NftPageDto = z.infer<typeof nftPageSchema>
export type NftListQuery = z.input<typeof nftListQuerySchema>
export type NftDetailDto = z.infer<typeof nftDetailSchema>
export type NftEditionDto = z.infer<typeof nftEditionSchema>
export type NftReviewDto = z.infer<typeof nftReviewSchema>
export type HighlightsDto = z.infer<typeof highlightsSchema>
export type EditionIdDto = z.infer<typeof editionIdSchema>

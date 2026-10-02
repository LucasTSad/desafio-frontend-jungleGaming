import { z } from 'zod'

export const CATALOG_COLLECTIONS = [
  { slug: 'arte-digital', label: 'Arte digital' },
  { slug: 'fotografia', label: 'Fotografia' },
  { slug: 'musica', label: 'Música' },
  { slug: 'arte-3d', label: 'Arte 3D' },
  { slug: 'colecionaveis', label: 'Colecionáveis' },
  { slug: 'generativa', label: 'Generativa' },
  { slug: 'jogos', label: 'Jogos' },
  { slug: 'assinaturas', label: 'Assinaturas' },
  { slug: 'utilidade', label: 'Utilidade' },
] as const

export const CATALOG_NETWORKS = [
  { slug: 'ethereum', label: 'Ethereum' },
  { slug: 'polygon', label: 'Polygon' },
  { slug: 'solana', label: 'Solana' },
] as const

export const CATALOG_TABS = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'em-alta', label: 'Em alta' },
] as const

export const CATALOG_SORTS = [
  { value: 'recentes', label: 'Listados recentemente' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
  { value: 'nome', label: 'Nome (A–Z)' },
] as const

export const CATALOG_PAGE_SIZE = 9

export type CollectionSlug = (typeof CATALOG_COLLECTIONS)[number]['slug']
export type NetworkSlug = (typeof CATALOG_NETWORKS)[number]['slug']
export type CatalogTab = (typeof CATALOG_TABS)[number]['value']
export type CatalogSort = (typeof CATALOG_SORTS)[number]['value']

const collectionSlugs = CATALOG_COLLECTIONS.map((c) => c.slug) as [
  CollectionSlug,
  ...CollectionSlug[],
]
const networkSlugs = CATALOG_NETWORKS.map((n) => n.slug) as [NetworkSlug, ...NetworkSlug[]]

// Listas trafegam na URL como texto separado por vírgula (ex.: collections=arte-digital,musica);
// valores desconhecidos são descartados para que links antigos ou editados à mão continuem válidos.
function listParam<T extends string>(allowed: readonly T[]) {
  return z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => {
      const items = (value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter((item): item is T => (allowed as readonly string[]).includes(item))
      return items.length > 0 ? [...new Set(items)].join(',') : undefined
    })
}

const priceParam = z.coerce.number().min(0).max(1000).optional().catch(undefined)

export const catalogSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .optional()
    .catch(undefined)
    .transform((value) => value || undefined),
  collections: listParam(collectionSlugs),
  networks: listParam(networkSlugs),
  priceMin: priceParam,
  priceMax: priceParam,
  tab: z
    .enum(CATALOG_TABS.map((t) => t.value) as [CatalogTab, ...CatalogTab[]])
    .optional()
    .catch(undefined),
  sort: z
    .enum(CATALOG_SORTS.map((s) => s.value) as [CatalogSort, ...CatalogSort[]])
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export function parseList<T extends string>(value: string | undefined): T[] {
  return value ? (value.split(',') as T[]) : []
}

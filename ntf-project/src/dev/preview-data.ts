// Dados de exemplo temporários para validar as telas contra o Figma.
// Este arquivo será removido quando a API (MSW) for integrada.

import type { HeaderUser } from '@/components/layout/site-header'
import {
  CATALOG_COLLECTIONS,
  CATALOG_NETWORKS,
  CATALOG_PAGE_SIZE,
  type CatalogSearch,
  type CollectionSlug,
  type NetworkSlug,
  parseList,
} from '@/features/catalog/search-params'
import type {
  CatalogFacets,
  CatalogPage,
  CatalogStatus,
  NftArtwork,
  NftSummary,
} from '@/features/catalog/types'

export const previewSession: { user: HeaderUser | null; cartCount: number } = {
  user: null,
  cartCount: 6,
}

/** Troque para 'loading' ou 'error' para revisar os demais estados do catálogo. */
export const previewCatalogStatus: CatalogStatus = 'success'

const ARTWORKS = {
  emerald: {
    src: '/images/nfts/emerald',
    alt: 'Macaco de pelo castanho com óculos redondos e jaqueta college verde',
  },
  sage: {
    src: '/images/nfts/sage',
    alt: 'Gorila de chapéu bucket verde-claro e moletom roxo',
  },
  ivory: {
    src: '/images/nfts/ivory',
    alt: 'Macaco de pelo escuro com blazer bege e gola alta verde',
  },
  golden: {
    src: '/images/nfts/golden',
    alt: 'Macaco de pelo dourado com fones de ouvido verdes e jaqueta clara',
  },
} satisfies Record<string, NftArtwork>

type PreviewNft = NftSummary & { isNew: boolean; isTrending: boolean; listedAt: string }

type Row = [
  name: string,
  art: keyof typeof ARTWORKS,
  collection: CollectionSlug,
  network: NetworkSlug,
  price: number,
  flags?: string,
  previousPrice?: number,
]

const ROWS: Row[] = [
  ['Emerald Ape #042', 'emerald', 'arte-digital', 'ethereum', 1.19, 'hot'],
  ['Sage Nomad #009', 'sage', 'colecionaveis', 'polygon', 1.69, 'new hot'],
  ['Neon Vessel #552', 'ivory', 'arte-3d', 'ethereum', 1.99, 'rare', 2.29],
  ['Cosmic Bloom #118', 'sage', 'generativa', 'solana', 1.29, 'new'],
  ['Violet Nomad #314', 'sage', 'fotografia', 'polygon', 1.39],
  ['Ivory Baron #088', 'ivory', 'arte-digital', 'ethereum', 1.79, 'hot'],
  ['Golden Beat #207', 'golden', 'musica', 'solana', 0.99, 'new'],
  ['Amber Pulse #233', 'golden', 'musica', 'polygon', 0.59],
  ['Golden Signal #160', 'golden', 'musica', 'ethereum', 0.39, 'hot'],
  ['Jade Monarch #071', 'emerald', 'colecionaveis', 'ethereum', 3.45, 'rare hot'],
  ['Velvet Drifter #402', 'sage', 'assinaturas', 'polygon', 0.42],
  ['Obsidian Sage #019', 'ivory', 'arte-digital', 'solana', 2.1, 'new'],
  ['Copper Groove #318', 'golden', 'musica', 'ethereum', 0.75],
  ['Mossy Wanderer #256', 'sage', 'jogos', 'polygon', 0.18, 'new'],
  ['Gilded Echo #144', 'golden', 'arte-3d', 'solana', 4.8, 'rare', 5.2],
  ['Pine Collector #063', 'emerald', 'fotografia', 'ethereum', 1.05],
  ['Twilight Scholar #377', 'ivory', 'utilidade', 'polygon', 0.88, 'hot'],
  ['Lilac Voyager #129', 'sage', 'generativa', 'ethereum', 2.65],
  ['Saffron Tempo #290', 'golden', 'musica', 'polygon', 0.27, 'new'],
  ['Ivy Regent #011', 'emerald', 'arte-digital', 'ethereum', 12.3, 'rare hot'],
  ['Ash Curator #345', 'ivory', 'colecionaveis', 'solana', 1.55],
  ['Heather Nomad #188', 'sage', 'assinaturas', 'ethereum', 0.65],
  ['Honey Frequency #412', 'golden', 'utilidade', 'solana', 0.09],
  ['Verdant Muse #097', 'emerald', 'arte-3d', 'polygon', 2.95, 'new'],
  ['Slate Visionary #263', 'ivory', 'generativa', 'ethereum', 3.2, '', 3.6],
  ['Plum Sentinel #154', 'sage', 'jogos', 'solana', 0.33, 'hot'],
  ['Marigold Loop #381', 'golden', 'jogos', 'polygon', 0.02, 'new'],
  ['Emerald Patron #027', 'emerald', 'utilidade', 'ethereum', 6.75, 'rare'],
  ['Onyx Flâneur #206', 'ivory', 'fotografia', 'polygon', 1.12],
  ['Lavender Echo #330', 'sage', 'arte-digital', 'solana', 0.81],
  ['Brass Rhythm #175', 'golden', 'assinaturas', 'ethereum', 1.48, 'hot'],
  ['Fern Archivist #058', 'emerald', 'fotografia', 'solana', 0.95],
  ['Charcoal Dandy #299', 'ivory', 'jogos', 'ethereum', 2.25, 'new'],
  ['Mauve Pilgrim #213', 'sage', 'colecionaveis', 'ethereum', 0.54],
  ['Amber Static #366', 'golden', 'generativa', 'polygon', 0.71],
  ['Cedar Laureate #105', 'emerald', 'arte-3d', 'solana', 8.4, 'rare', 9.1],
]

const PREVIEW_NFTS: PreviewNft[] = ROWS.map(
  ([name, art, collection, network, priceEth, flags = '', previousPriceEth], index) => ({
    id: name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    name,
    artwork: ARTWORKS[art],
    priceEth,
    previousPriceEth,
    collection,
    network,
    isRare: flags.includes('rare'),
    isNew: flags.includes('new'),
    isTrending: flags.includes('hot'),
    listedAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
  }),
)

function toSummary({ isNew: _n, isTrending: _t, listedAt: _l, ...nft }: PreviewNft): NftSummary {
  return nft
}

function findNft(name: string) {
  const nft = PREVIEW_NFTS.find((item) => item.name === name)
  if (!nft) throw new Error(`NFT de exemplo não encontrado: ${name}`)
  return toSummary(nft)
}

export const previewHeroSlides: NftSummary[] = [
  findNft('Emerald Ape #042'),
  findNft('Ivory Baron #088'),
  findNft('Golden Beat #207'),
]

export const previewFeaturedNft: NftSummary = findNft('Sage Nomad #009')

export const previewFavoriteIds = ['emerald-ape-042', 'golden-beat-207']

export const previewCatalogFacets: CatalogFacets = {
  collections: CATALOG_COLLECTIONS.map(({ slug }) => ({
    value: slug,
    count: PREVIEW_NFTS.filter((nft) => nft.collection === slug).length,
  })),
  networks: CATALOG_NETWORKS.map(({ slug }) => ({
    value: slug,
    count: PREVIEW_NFTS.filter((nft) => nft.network === slug).length,
  })),
  priceRange: {
    min: Math.min(...PREVIEW_NFTS.map((nft) => nft.priceEth)),
    max: Math.max(...PREVIEW_NFTS.map((nft) => nft.priceEth)),
  },
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const nameCollator = new Intl.Collator('pt-BR')

/** Reproduz no cliente o que a API fará: filtrar, ordenar e paginar o catálogo. */
export function previewCatalogPage(search: CatalogSearch): CatalogPage {
  const collections = parseList<CollectionSlug>(search.collections)
  const networks = parseList<NetworkSlug>(search.networks)
  const query = search.q ? normalize(search.q) : ''

  const filtered = PREVIEW_NFTS.filter((nft) => {
    if (query && !normalize(nft.name).includes(query)) return false
    if (collections.length > 0 && !collections.includes(nft.collection)) return false
    if (networks.length > 0 && !networks.includes(nft.network)) return false
    if (search.priceMin !== undefined && nft.priceEth < search.priceMin) return false
    if (search.priceMax !== undefined && nft.priceEth > search.priceMax) return false
    if (search.tab === 'novos' && !nft.isNew) return false
    if (search.tab === 'em-alta' && !nft.isTrending) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    switch (search.sort) {
      case 'menor-preco':
        return a.priceEth - b.priceEth
      case 'maior-preco':
        return b.priceEth - a.priceEth
      case 'nome':
        return nameCollator.compare(a.name, b.name)
      default:
        return b.listedAt.localeCompare(a.listedAt)
    }
  })

  const pageCount = Math.max(1, Math.ceil(sorted.length / CATALOG_PAGE_SIZE))
  const page = Math.min(search.page ?? 1, pageCount)
  const start = (page - 1) * CATALOG_PAGE_SIZE

  return {
    items: sorted.slice(start, start + CATALOG_PAGE_SIZE).map(toSummary),
    page,
    pageCount,
    total: sorted.length,
  }
}

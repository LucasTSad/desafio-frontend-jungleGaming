// Dados de exemplo temporários para validar as telas contra o Figma.
// Este arquivo será removido quando a API (MSW) for integrada.

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
import type { EditionId, NftDetail, NftGalleryImage, NftReview } from '@/features/nft/types'

/** Troque para 'loading' ou 'error' para revisar os demais estados de catálogo, detalhe e carrinho. */
export const previewDataStatus: CatalogStatus = 'success'

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

const EDITION_LABELS: Record<EditionId, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  aberta: 'ABERTA',
}

const GALLERY_FOCUS: { label: string; focus?: NftGalleryImage['focus'] }[] = [
  { label: 'arte completa' },
  { label: 'detalhe do rosto', focus: { scale: 1.9, x: 50, y: 32 } },
  { label: 'detalhe da roupa', focus: { scale: 2.1, x: 50, y: 88 } },
  { label: 'detalhe do fundo', focus: { scale: 1.6, x: 12, y: 18 } },
]

const REVIEWS: NftReview[] = [
  {
    id: 'r1',
    author: 'Marina Costa',
    rating: 5,
    date: '2026-09-21',
    comment:
      'Arte impecável e entrega imediata na carteira. A procedência verificada me deu segurança.',
  },
  {
    id: 'r2',
    author: 'Diego Alves',
    rating: 5,
    date: '2026-09-18',
    comment: 'Os detalhes em alta resolução são incríveis. Já estou de olho no próximo lançamento.',
  },
  {
    id: 'r3',
    author: 'Lia Moreira',
    rating: 4,
    date: '2026-09-12',
    comment: 'Ótima curadoria. Só senti falta de mais informações sobre o processo do artista.',
  },
  {
    id: 'r4',
    author: 'Rafael Nunes',
    rating: 5,
    date: '2026-09-05',
    comment: 'Comprei a edição 1/50 e o acesso exclusivo para colecionadores valeu cada ETH.',
  },
]

const networkLabel = (slug: NetworkSlug) =>
  CATALOG_NETWORKS.find((network) => network.slug === slug)?.label ?? slug

function toDetail(nft: PreviewNft, index: number): NftDetail {
  const number = nft.name.split('#')[1] ?? '0'
  const network = networkLabel(nft.network)

  return {
    ...toSummary(nft),
    tokenId: `#${number.padStart(4, '0')}`,
    creator: 'Nova Sato',
    about: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${nft.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    networkInfo: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contract: `0x7A${number.padStart(2, '0').slice(-2)}...19E8 • Contrato inteligente ERC-721 verificado.`,
    royalties:
      '5% para o criador nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    attributes: ARTWORK_ATTRIBUTES[nft.artwork.src] ?? [],
    rating: { average: Math.round((4.8 - (index % 5) * 0.1) * 10) / 10, count: 19 + index * 3 },
    editions: [
      { id: '1-1', label: EDITION_LABELS['1-1'], available: index % 3 === 0 ? 0 : 1 },
      { id: '1-10', label: EDITION_LABELS['1-10'], available: (index % 4) + 2 },
      { id: '1-50', label: EDITION_LABELS['1-50'], available: 12 + (index % 7) },
      { id: 'aberta', label: EDITION_LABELS.aberta, available: null },
    ],
    gallery: GALLERY_FOCUS.map(({ label, focus }) => ({
      src: nft.artwork.src,
      alt: `${nft.artwork.alt} — ${label}`,
      focus,
    })),
  }
}

const ARTWORK_ATTRIBUTES: Record<string, string[]> = {
  [ARTWORKS.emerald.src]: ['Óculos', 'Esmeralda', 'Raro'],
  [ARTWORKS.sage.src]: ['Chapéu bucket', 'Moletom', 'Lilás'],
  [ARTWORKS.ivory.src]: ['Blazer', 'Gola alta', 'Brinco'],
  [ARTWORKS.golden.src]: ['Fones', 'Jaqueta', 'Dourado'],
}

export function previewNftDetail(id: string): NftDetail | undefined {
  const index = PREVIEW_NFTS.findIndex((nft) => nft.id === id)
  const nft = PREVIEW_NFTS[index]
  return nft ? toDetail(nft, index) : undefined
}

export function previewNftReviews(): NftReview[] {
  return REVIEWS
}

/** Outros NFTs da mesma coleção, completados com os mais recentes até 8 itens. */
export function previewRelatedNfts(id: string): NftSummary[] {
  const current = PREVIEW_NFTS.find((nft) => nft.id === id)
  const others = PREVIEW_NFTS.filter((nft) => nft.id !== id)
  const sameCollection = others.filter((nft) => nft.collection === current?.collection)
  const rest = others.filter((nft) => nft.collection !== current?.collection)
  return [...sameCollection, ...rest].slice(0, 8).map(toSummary)
}

export function previewRecommendations(excludeIds: string[]): NftSummary[] {
  return PREVIEW_NFTS.filter((nft) => !excludeIds.includes(nft.id))
    .filter((nft) => nft.isTrending)
    .slice(0, 10)
    .map(toSummary)
}

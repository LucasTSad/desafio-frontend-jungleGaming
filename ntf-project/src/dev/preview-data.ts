// Dados de exemplo temporários usados só pelo carrinho de exemplo.
// Este arquivo será removido quando o carrinho for integrado à API (MSW).

import type { CollectionSlug, NetworkSlug } from '@/features/catalog/search-params'
import type { CatalogStatus, NftArtwork } from '@/features/catalog/types'
import type { EditionId, NftEdition } from '@/features/nft/types'

/** Troque para 'loading' ou 'error' para revisar os demais estados do carrinho e do pagamento. */
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

type PreviewNft = {
  id: string
  name: string
  artwork: NftArtwork
  priceEth: number
  collection: CollectionSlug
  network: NetworkSlug
}

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

const PREVIEW_NFTS: PreviewNft[] = ROWS.map(([name, art, collection, network, priceEth]) => ({
  id: name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, ''),
  name,
  artwork: ARTWORKS[art],
  priceEth,
  collection,
  network,
}))

const EDITION_LABELS: Record<EditionId, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  aberta: 'ABERTA',
}

export type PreviewCartNft = PreviewNft & { tokenId: string; editions: NftEdition[] }

export function previewNftDetail(id: string): PreviewCartNft | undefined {
  const index = PREVIEW_NFTS.findIndex((nft) => nft.id === id)
  const nft = PREVIEW_NFTS[index]
  if (!nft) return undefined
  const number = nft.name.split('#')[1] ?? '0'
  return {
    ...nft,
    tokenId: `#${number.padStart(4, '0')}`,
    editions: [
      { id: '1-1', label: EDITION_LABELS['1-1'], available: index % 3 === 0 ? 0 : 1 },
      { id: '1-10', label: EDITION_LABELS['1-10'], available: (index % 4) + 2 },
      { id: '1-50', label: EDITION_LABELS['1-50'], available: 12 + (index % 7) },
      { id: 'aberta', label: EDITION_LABELS.aberta, available: null },
    ],
  }
}

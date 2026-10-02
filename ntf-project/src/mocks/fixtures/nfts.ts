import type { EditionIdDto, NftDetailDto, NftReviewDto } from '@/api/contracts/nfts'
import {
  CATALOG_NETWORKS,
  type CollectionSlug,
  type NetworkSlug,
} from '@/features/catalog/search-params'

/** Conteúdo fixo de cada NFT; preço, estoque e versão ficam no banco do mock e podem mudar. */
export type NftFixture = {
  id: string
  name: string
  art: ArtworkKey
  collection: CollectionSlug
  network: NetworkSlug
  priceEth: string
  previousPriceEth: string | null
  isRare: boolean
  isNew: boolean
  isTrending: boolean
  listedAt: string
  editions: Record<EditionIdDto, number | null>
  index: number
}

const ARTWORKS = {
  emerald: {
    src: '/images/nfts/emerald',
    alt: 'Macaco de pelo castanho com óculos redondos e jaqueta college verde',
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
  },
  sage: {
    src: '/images/nfts/sage',
    alt: 'Gorila de chapéu bucket verde-claro e moletom roxo',
    attributes: ['Chapéu bucket', 'Moletom', 'Lilás'],
  },
  ivory: {
    src: '/images/nfts/ivory',
    alt: 'Macaco de pelo escuro com blazer bege e gola alta verde',
    attributes: ['Blazer', 'Gola alta', 'Brinco'],
  },
  golden: {
    src: '/images/nfts/golden',
    alt: 'Macaco de pelo dourado com fones de ouvido verdes e jaqueta clara',
    attributes: ['Fones', 'Jaqueta', 'Dourado'],
  },
} as const

type ArtworkKey = keyof typeof ARTWORKS

type Row = [
  name: string,
  art: ArtworkKey,
  collection: CollectionSlug,
  network: NetworkSlug,
  price: string,
  flags?: string,
  previousPrice?: string,
]

const ROWS: Row[] = [
  ['Emerald Ape #042', 'emerald', 'arte-digital', 'ethereum', '1.19', 'hot'],
  ['Sage Nomad #009', 'sage', 'colecionaveis', 'polygon', '1.69', 'new hot'],
  ['Neon Vessel #552', 'ivory', 'arte-3d', 'ethereum', '1.99', 'rare', '2.29'],
  ['Cosmic Bloom #118', 'sage', 'generativa', 'solana', '1.29', 'new'],
  ['Violet Nomad #314', 'sage', 'fotografia', 'polygon', '1.39'],
  ['Ivory Baron #088', 'ivory', 'arte-digital', 'ethereum', '1.79', 'hot'],
  ['Golden Beat #207', 'golden', 'musica', 'solana', '0.99', 'new'],
  ['Amber Pulse #233', 'golden', 'musica', 'polygon', '0.59'],
  ['Golden Signal #160', 'golden', 'musica', 'ethereum', '0.39', 'hot'],
  ['Jade Monarch #071', 'emerald', 'colecionaveis', 'ethereum', '3.45', 'rare hot'],
  ['Velvet Drifter #402', 'sage', 'assinaturas', 'polygon', '0.42'],
  ['Obsidian Sage #019', 'ivory', 'arte-digital', 'solana', '2.1', 'new'],
  ['Copper Groove #318', 'golden', 'musica', 'ethereum', '0.75'],
  ['Mossy Wanderer #256', 'sage', 'jogos', 'polygon', '0.18', 'new'],
  ['Gilded Echo #144', 'golden', 'arte-3d', 'solana', '4.8', 'rare', '5.2'],
  ['Pine Collector #063', 'emerald', 'fotografia', 'ethereum', '1.05'],
  ['Twilight Scholar #377', 'ivory', 'utilidade', 'polygon', '0.88', 'hot'],
  ['Lilac Voyager #129', 'sage', 'generativa', 'ethereum', '2.65'],
  ['Saffron Tempo #290', 'golden', 'musica', 'polygon', '0.27', 'new'],
  ['Ivy Regent #011', 'emerald', 'arte-digital', 'ethereum', '12.3', 'rare hot'],
  ['Ash Curator #345', 'ivory', 'colecionaveis', 'solana', '1.55'],
  ['Heather Nomad #188', 'sage', 'assinaturas', 'ethereum', '0.65'],
  ['Honey Frequency #412', 'golden', 'utilidade', 'solana', '0.09'],
  ['Verdant Muse #097', 'emerald', 'arte-3d', 'polygon', '2.95', 'new'],
  ['Slate Visionary #263', 'ivory', 'generativa', 'ethereum', '3.2', '', '3.6'],
  ['Plum Sentinel #154', 'sage', 'jogos', 'solana', '0.33', 'hot'],
  ['Marigold Loop #381', 'golden', 'jogos', 'polygon', '0.02', 'new'],
  ['Emerald Patron #027', 'emerald', 'utilidade', 'ethereum', '6.75', 'rare'],
  ['Onyx Flâneur #206', 'ivory', 'fotografia', 'polygon', '1.12'],
  ['Lavender Echo #330', 'sage', 'arte-digital', 'solana', '0.81'],
  ['Brass Rhythm #175', 'golden', 'assinaturas', 'ethereum', '1.48', 'hot'],
  ['Fern Archivist #058', 'emerald', 'fotografia', 'solana', '0.95'],
  ['Charcoal Dandy #299', 'ivory', 'jogos', 'ethereum', '2.25', 'new'],
  ['Mauve Pilgrim #213', 'sage', 'colecionaveis', 'ethereum', '0.54'],
  ['Amber Static #366', 'golden', 'generativa', 'polygon', '0.71'],
  ['Cedar Laureate #105', 'emerald', 'arte-3d', 'solana', '8.4', 'rare', '9.1'],
]

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const NFT_FIXTURES: NftFixture[] = ROWS.map(
  ([name, art, collection, network, priceEth, flags = '', previousPriceEth], index) => ({
    id: slugify(name),
    name,
    art,
    collection,
    network,
    priceEth,
    previousPriceEth: previousPriceEth ?? null,
    isRare: flags.includes('rare'),
    isNew: flags.includes('new'),
    isTrending: flags.includes('hot'),
    listedAt: new Date(Date.UTC(2026, 8, 30 - index)).toISOString(),
    editions: {
      '1-1': index % 3 === 0 ? 0 : 1,
      '1-10': (index % 4) + 2,
      '1-50': 12 + (index % 7),
      aberta: null,
    },
    index,
  }),
)

export const HERO_NFT_IDS = ['emerald-ape-042', 'ivory-baron-088', 'golden-beat-207']
export const FEATURED_NFT_ID = 'sage-nomad-009'
export const MAX_PER_ORDER = 10

export const EDITION_LABELS: Record<EditionIdDto, string> = {
  '1-1': '1/1',
  '1-10': '1/10',
  '1-50': '1/50',
  aberta: 'ABERTA',
}

export const EDITION_ORDER: EditionIdDto[] = ['1-1', '1-10', '1-50', 'aberta']

const GALLERY_FOCUS: { label: string; focus?: { scale: number; x: number; y: number } }[] = [
  { label: 'arte completa' },
  { label: 'detalhe do rosto', focus: { scale: 1.9, x: 50, y: 32 } },
  { label: 'detalhe da roupa', focus: { scale: 2.1, x: 50, y: 88 } },
  { label: 'detalhe do fundo', focus: { scale: 1.6, x: 12, y: 18 } },
]

export const REVIEWS: NftReviewDto[] = [
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

export function artworkOf(fixture: NftFixture) {
  const { src, alt } = ARTWORKS[fixture.art]
  return { src, alt }
}

const networkLabel = (slug: NetworkSlug) =>
  CATALOG_NETWORKS.find((network) => network.slug === slug)?.label ?? slug

/** Textos e galeria do detalhe, derivados só do conteúdo fixo do NFT. */
export function detailContentOf(fixture: NftFixture) {
  const number = fixture.name.split('#')[1] ?? '0'
  const network = networkLabel(fixture.network)
  const artwork = ARTWORKS[fixture.art]

  return {
    tokenId: `#${number.padStart(4, '0')}`,
    creator: 'Nova Sato',
    about: `Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na ${network}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${fixture.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.',
    ],
    networkInfo: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contract: `0x7A${number.padStart(2, '0').slice(-2)}...19E8 • Contrato inteligente ERC-721 verificado.`,
    royalties:
      '5% para o criador nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.',
    attributes: [...artwork.attributes],
    rating: {
      average: Math.round((4.8 - (fixture.index % 5) * 0.1) * 10) / 10,
      count: 19 + fixture.index * 3,
    },
    reviews: REVIEWS,
    gallery: GALLERY_FOCUS.map(({ label, focus }) => ({
      src: artwork.src,
      alt: `${artwork.alt} — ${label}`,
      ...(focus ? { focus } : {}),
    })),
    maxPerOrder: MAX_PER_ORDER,
  } satisfies Partial<NftDetailDto>
}

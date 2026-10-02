import type { CatalogSearch } from '@/features/catalog/search-params'

export type PromoBanner = {
  title: string
  description: string
  image: { src: string; alt: string }
  search: Partial<CatalogSearch>
}

export const PROMO_BANNERS: PromoBanner[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: { src: '/images/nfts/emerald', alt: '' },
    search: { tab: 'novos' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: { src: '/images/nfts/ivory', alt: '' },
    search: { collections: 'arte-digital' },
  },
]

export type JournalPost = {
  date: string
  readingTime: string
  title: string
  excerpt: string
  image: string
}

export const JOURNAL_POSTS: JournalPost[] = [
  {
    date: '12 de setembro',
    readingTime: 'Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/ivory',
  },
  {
    date: '13 de setembro',
    readingTime: 'Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nfts/emerald',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nfts/sage',
  },
  {
    date: '15 de setembro',
    readingTime: 'Leitura de 2 min',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/golden',
  },
]

import type { z } from 'zod'
import type {
  EditionIdDto,
  NftDetailDto,
  nftListQuerySchema,
  NftPageDto,
  NftSummaryDto,
} from '@/api/contracts/nfts'
import {
  CATALOG_COLLECTIONS,
  CATALOG_NETWORKS,
  CATALOG_PAGE_SIZE,
} from '@/features/catalog/search-params'
import { compareEth } from '@/lib/eth'
import { db } from './db/store'
import {
  artworkOf,
  detailContentOf,
  EDITION_LABELS,
  EDITION_ORDER,
  NFT_FIXTURES,
  type NftFixture,
} from './fixtures/nfts'
import { MockApiError } from './respond'

type ListQuery = z.output<typeof nftListQuerySchema>

const RELATED_LIMIT = 8
const RECOMMENDATIONS_LIMIT = 10

export function findFixture(id: string) {
  return NFT_FIXTURES.find((fixture) => fixture.id === id)
}

export function requireFixture(id: string) {
  const fixture = findFixture(id)
  if (!fixture) throw new MockApiError('NOT_FOUND', 'Este NFT não existe ou foi removido.')
  return fixture
}

/** Junta o conteúdo fixo do NFT com o estado que muda no banco (preço, estoque e versão). */
export function toSummary(fixture: NftFixture): NftSummaryDto {
  const state = db.get().nfts[fixture.id]
  return {
    id: fixture.id,
    name: fixture.name,
    artwork: artworkOf(fixture),
    priceEth: state?.priceEth ?? fixture.priceEth,
    previousPriceEth: state ? state.previousPriceEth : fixture.previousPriceEth,
    collection: fixture.collection,
    network: fixture.network,
    isRare: fixture.isRare,
    version: state?.version ?? 1,
  }
}

export function toDetail(fixture: NftFixture): NftDetailDto {
  const editions = db.get().nfts[fixture.id]?.editions ?? fixture.editions
  return {
    ...toSummary(fixture),
    ...detailContentOf(fixture),
    editions: EDITION_ORDER.map((id) => ({
      id,
      label: EDITION_LABELS[id],
      available: editions[id],
    })),
  }
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const nameCollator = new Intl.Collator('pt-BR')

const listOf = (value: string | undefined) => (value ? value.split(',') : [])

function sortFixtures(items: NftFixture[], sort: ListQuery['sort']) {
  const price = (fixture: NftFixture) => toSummary(fixture).priceEth
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'menor-preco':
        return compareEth(price(a), price(b))
      case 'maior-preco':
        return compareEth(price(b), price(a))
      case 'nome':
        return nameCollator.compare(a.name, b.name)
      default:
        return b.listedAt.localeCompare(a.listedAt)
    }
  })
}

/** Contagens e faixa de preço do catálogo inteiro, para os filtros não mudarem a cada busca. */
function facetsOf(items: NftFixture[]): NftPageDto['facets'] {
  const prices = items.map((fixture) => toSummary(fixture).priceEth)
  const sorted = [...prices].sort(compareEth)
  return {
    collections: CATALOG_COLLECTIONS.map(({ slug }) => ({
      value: slug,
      count: items.filter((fixture) => fixture.collection === slug).length,
    })),
    networks: CATALOG_NETWORKS.map(({ slug }) => ({
      value: slug,
      count: items.filter((fixture) => fixture.network === slug).length,
    })),
    priceRange: { min: sorted[0] ?? '0', max: sorted.at(-1) ?? '0' },
  }
}

export function listNfts(query: ListQuery, catalog: NftFixture[] = NFT_FIXTURES): NftPageDto {
  const collections = listOf(query.collections)
  const networks = listOf(query.networks)
  const text = query.q ? normalize(query.q) : ''

  const filtered = catalog.filter((fixture) => {
    const { priceEth } = toSummary(fixture)
    if (text && !normalize(fixture.name).includes(text)) return false
    if (collections.length > 0 && !collections.includes(fixture.collection)) return false
    if (networks.length > 0 && !networks.includes(fixture.network)) return false
    if (query.priceMin && compareEth(priceEth, query.priceMin) < 0) return false
    if (query.priceMax && compareEth(priceEth, query.priceMax) > 0) return false
    if (query.tab === 'novos' && !fixture.isNew) return false
    if (query.tab === 'em-alta' && !fixture.isTrending) return false
    return true
  })

  const pageSize = query.pageSize ?? CATALOG_PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(query.page ?? 1, pageCount)
  const start = (page - 1) * pageSize

  return {
    items: sortFixtures(filtered, query.sort)
      .slice(start, start + pageSize)
      .map(toSummary),
    page,
    pageSize,
    total: filtered.length,
    pageCount,
    facets: facetsOf(catalog),
  }
}

/** "Mais desta coleção": mesma coleção primeiro, completando com os mais recentes. */
export function relatedTo(fixture: NftFixture) {
  const others = sortFixtures(
    NFT_FIXTURES.filter((item) => item.id !== fixture.id),
    'recentes',
  )
  const sameCollection = others.filter((item) => item.collection === fixture.collection)
  const rest = others.filter((item) => item.collection !== fixture.collection)
  return [...sameCollection, ...rest].slice(0, RELATED_LIMIT).map(toSummary)
}

export function recommendations(excludeIds: string[]) {
  return NFT_FIXTURES.filter((fixture) => fixture.isTrending && !excludeIds.includes(fixture.id))
    .slice(0, RECOMMENDATIONS_LIMIT)
    .map(toSummary)
}

export type NftChange = {
  priceEth?: string
  editions?: Partial<Record<EditionIdDto, number | null>>
}

/** Muda preço e/ou estoque de um NFT, guardando o preço anterior e subindo a versão. */
export function updateNft(id: string, change: NftChange) {
  const fixture = requireFixture(id)
  return db.update((draft) => {
    const state = (draft.nfts[id] ??= {
      priceEth: fixture.priceEth,
      previousPriceEth: fixture.previousPriceEth,
      editions: { ...fixture.editions },
      version: 1,
    })
    if (change.priceEth && change.priceEth !== state.priceEth) {
      state.previousPriceEth = state.priceEth
      state.priceEth = change.priceEth
    }
    state.editions = { ...state.editions, ...change.editions }
    state.version += 1
    return toSummary(fixture)
  })
}

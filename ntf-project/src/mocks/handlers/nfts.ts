import { HttpResponse } from 'msw'
import { nftListQuerySchema } from '@/api/contracts/nfts'
import { API_PATHS } from '@/api/paths'
import {
  listNfts,
  recommendations,
  relatedTo,
  requireFixture,
  toDetail,
  toSummary,
} from '../catalog'
import { FEATURED_NFT_ID, HERO_NFT_IDS } from '../fixtures/nfts'
import { api, MockApiError } from '../respond'
import { isScenario } from '../scenarios'

// As rotas fixas vêm antes de "/nfts/:nftId" para não serem lidas como um id.
export const nftHandlers = [
  api.get(API_PATHS.highlights, () =>
    HttpResponse.json({
      hero: HERO_NFT_IDS.map((id) => toSummary(requireFixture(id))),
      featured: toSummary(requireFixture(FEATURED_NFT_ID)),
    }),
  ),

  api.get(API_PATHS.recommendations, ({ request }) => {
    const exclude = new URL(request.url).searchParams.get('exclude')?.split(',') ?? []
    return HttpResponse.json({ items: isScenario('vazio') ? [] : recommendations(exclude) })
  }),

  api.get(API_PATHS.nfts, ({ request }) => {
    const params = Object.fromEntries(new URL(request.url).searchParams)
    const query = nftListQuerySchema.safeParse(params)
    if (!query.success) {
      throw new MockApiError('BAD_REQUEST', 'Os filtros da busca são inválidos.')
    }
    return HttpResponse.json(listNfts(query.data, isScenario('vazio') ? [] : undefined))
  }),

  api.get<{ nftId: string }>(API_PATHS.nft(), ({ params }) =>
    HttpResponse.json(toDetail(requireFixture(params.nftId))),
  ),

  api.get<{ nftId: string }>(API_PATHS.relatedNfts(), ({ params }) => {
    const fixture = requireFixture(params.nftId)
    return HttpResponse.json({ items: isScenario('vazio') ? [] : relatedTo(fixture) })
  }),
]

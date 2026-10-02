import { HttpResponse } from 'msw'
import { API_PATHS } from '@/api/paths'
import { requireUser } from '../auth'
import { findFixture, requireFixture, toSummary } from '../catalog'
import { db } from '../db/store'
import { api } from '../respond'

export const favoriteHandlers = [
  // Mais recentes primeiro; ids de NFTs que deixaram de existir são ignorados.
  api.get(API_PATHS.favorites, ({ request }) => {
    const user = requireUser(request)
    const ids = [...(db.get().favorites[user.id] ?? [])].reverse()
    const items = ids.flatMap((id) => {
      const fixture = findFixture(id)
      return fixture ? [toSummary(fixture)] : []
    })
    return HttpResponse.json({ items })
  }),

  api.put<{ nftId: string }>(API_PATHS.favorite(), ({ request, params }) => {
    const user = requireUser(request)
    requireFixture(params.nftId)
    db.update((draft) => {
      const list = (draft.favorites[user.id] ??= [])
      if (!list.includes(params.nftId)) list.push(params.nftId)
    })
    return new HttpResponse(null, { status: 204 })
  }),

  api.delete<{ nftId: string }>(API_PATHS.favorite(), ({ request, params }) => {
    const user = requireUser(request)
    db.update((draft) => {
      draft.favorites[user.id] = (draft.favorites[user.id] ?? []).filter(
        (id) => id !== params.nftId,
      )
    })
    return new HttpResponse(null, { status: 204 })
  }),
]

// Favoritos de exemplo em memória, temporários até a integração com a API (MSW).

import { useSyncExternalStore } from 'react'
import type { NftSummary } from '@/features/catalog/types'
import { announce } from '@/lib/announce'

let favoriteIds: ReadonlySet<string> = new Set(['emerald-ape-042', 'golden-beat-207'])
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function usePreviewFavorites() {
  return useSyncExternalStore(subscribe, () => favoriteIds)
}

export function togglePreviewFavorite(nft: Pick<NftSummary, 'id' | 'name'>) {
  const next = new Set(favoriteIds)
  const wasFavorite = next.delete(nft.id)
  if (!wasFavorite) next.add(nft.id)
  favoriteIds = next
  for (const listener of listeners) listener()
  announce(`${nft.name} ${wasFavorite ? 'removido dos' : 'adicionado aos'} favoritos`)
}

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { FavoritesView } from '@/features/account/components/favorites-view'
import { favoritesQueryOptions, useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/favoritos')({
  loader: ({ context: { queryClient, user } }) =>
    queryClient.ensureQueryData(favoritesQueryOptions(user.id)),
  component: FavoritesPage,
})

function FavoritesPage() {
  const { user } = Route.useRouteContext()
  const { data } = useSuspenseQuery(favoritesQueryOptions(user.id))
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  // A lista é fixada ao abrir a página para que desfavoritar não tire o card (e o foco) da tela.
  const [items] = useState(data)

  useDocumentTitle('Lista de interesse')

  return (
    <FavoritesView
      key={user.id}
      status="success"
      items={items}
      favoriteIds={favoriteIds}
      onToggleFavorite={toggleFavorite}
      onRetry={() => window.location.reload()}
    />
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { previewDataStatus, previewNftSummaries } from '@/dev/preview-data'
import { togglePreviewFavorite, usePreviewFavorites } from '@/dev/preview-favorites'
import { FavoritesView } from '@/features/account/components/favorites-view'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/favoritos')({
  component: FavoritesPage,
})

function FavoritesPage() {
  const favoriteIds = usePreviewFavorites()
  // A lista é fixada ao abrir a página para que desfavoritar não tire o card (e o foco) da tela.
  const [items] = useState(() => previewNftSummaries([...favoriteIds].reverse()))

  useDocumentTitle('Lista de interesse')

  return (
    <FavoritesView
      status={previewDataStatus}
      items={items}
      favoriteIds={favoriteIds}
      onToggleFavorite={togglePreviewFavorite}
      onRetry={() => window.location.reload()}
    />
  )
}

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { previewCartActions, usePreviewCart } from '@/dev/preview-cart'
import { previewDataStatus } from '@/dev/preview-data'
import { recommendationsQueryOptions } from '@/features/catalog/api'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { CartView } from '@/features/cart/components/cart-view'
import { announce } from '@/lib/announce'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/carrinho')({
  staticData: { nav: 'market' },
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const { lines, totals, coupon } = usePreviewCart()
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const recommendations =
    useQuery(recommendationsQueryOptions(lines.map((line) => line.nftId))).data ?? []

  useDocumentTitle('Carrinho')

  return (
    <CartView
      status={previewDataStatus}
      lines={lines}
      totals={totals}
      coupon={coupon}
      recommendations={recommendations}
      favoriteIds={favoriteIds}
      onToggleFavorite={toggleFavorite}
      onQuantityChange={(line, quantity) => previewCartActions.setQuantity(line.id, quantity)}
      onRemove={(line) => {
        previewCartActions.remove(line.id)
        announce(`${line.name} removido do carrinho`)
      }}
      onApplyCoupon={(code) => {
        const result = previewCartActions.applyCoupon(code)
        if (result.ok) announce('Cupom aplicado')
        return result
      }}
      onRemoveCoupon={() => previewCartActions.removeCoupon()}
      onCheckout={() => navigate({ to: '/pagamento' })}
      onRetry={() => window.location.reload()}
    />
  )
}

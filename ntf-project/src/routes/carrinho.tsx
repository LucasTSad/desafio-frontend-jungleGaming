import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { EMPTY_CART, useCart, useCartActions } from '@/features/cart/api'
import { CartView } from '@/features/cart/components/cart-view'
import { recommendationsQueryOptions, toCatalogStatus } from '@/features/catalog/api'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/carrinho')({
  staticData: { nav: 'market' },
  component: CartPage,
})

function CartPage() {
  const navigate = useNavigate()
  const cartQuery = useCart()
  const cart = cartQuery.cart ?? EMPTY_CART
  const actions = useCartActions()
  const favoriteIds = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const recommendations =
    useQuery(recommendationsQueryOptions(cart.lines.map((line) => line.nftId))).data ?? []

  useDocumentTitle('Carrinho')

  return (
    <CartView
      status={toCatalogStatus(cartQuery)}
      lines={cart.lines}
      totals={cart.totals}
      coupon={cart.coupon}
      recommendations={recommendations}
      favoriteIds={favoriteIds}
      onToggleFavorite={toggleFavorite}
      onQuantityChange={actions.setQuantity}
      onRemove={actions.remove}
      onApplyCoupon={actions.applyCoupon}
      onAcceptPrices={actions.acceptPrices}
      onRemoveCoupon={actions.removeCoupon}
      onCheckout={() => navigate({ to: '/pagamento' })}
      onRetry={() => void cartQuery.refetch()}
    />
  )
}

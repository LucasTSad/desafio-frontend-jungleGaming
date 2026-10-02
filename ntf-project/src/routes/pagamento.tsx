import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Clock } from 'lucide-react'
import { useMemo } from 'react'
import { profileQueryOptions, walletsQueryOptions } from '@/features/account/api'
import { toSavedWallets } from '@/features/account/mappers'
import { requireAuth } from '@/features/auth/require-auth'
import { EMPTY_CART, useCart } from '@/features/cart/api'
import { toCatalogStatus } from '@/features/catalog/api'
import { useCheckout } from '@/features/checkout/api'
import { CheckoutView } from '@/features/checkout/components/checkout-view'
import type { CheckoutInput } from '@/features/checkout/schemas'
import { pendingOrdersQueryOptions } from '@/features/orders/api'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/pagamento')({
  staticData: { nav: 'market', mobileActionBar: true },
  beforeLoad: requireAuth,
  loader: ({ context: { queryClient, user } }) =>
    Promise.all([
      queryClient.ensureQueryData(profileQueryOptions(user.id)),
      queryClient.ensureQueryData(walletsQueryOptions(user.id)),
    ]),
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const cartQuery = useCart()
  const { lines, totals, coupon } = cartQuery.cart ?? EMPTY_CART
  const { user } = Route.useRouteContext()
  const { data: profile } = useSuspenseQuery(profileQueryOptions(user.id))
  const { data: wallets } = useSuspenseQuery(walletsQueryOptions(user.id))
  const savedWallets = useMemo(() => toSavedWallets(wallets), [wallets])
  const checkout = useCheckout(cartQuery.cart?.version ?? 0)
  const { data: pending } = useQuery(pendingOrdersQueryOptions(user.id))
  const pendingOrder = pending?.[0]

  useDocumentTitle('Pagamento')

  const defaultValues = useMemo<Partial<CheckoutInput>>(() => {
    const wallet = savedWallets[0]
    return {
      displayName: profile.displayName,
      username: profile.username,
      profileName: '',
      email: profile.email,
      referralCode: '',
      ensName: profile.ensName,
      secondaryWallet: '',
      note: '',
      walletSource: wallet ? 'saved' : 'other',
      savedWalletId: wallet?.id,
      network: wallet?.network,
      walletAddress: wallet?.address ?? '',
      walletType: wallet?.provider,
      provider: wallet?.provider,
    }
  }, [profile, savedWallets])

  return (
    <CheckoutView
      status={toCatalogStatus(cartQuery)}
      lines={lines}
      totals={totals}
      coupon={coupon}
      savedWallets={savedWallets}
      defaultValues={defaultValues}
      onQuote={checkout.quote}
      onPay={checkout.pay}
      onPlaced={(orderId) => navigate({ to: '/pedidos/$orderId', params: { orderId } })}
      onRetry={() => void cartQuery.refetch()}
      notice={
        pendingOrder && (
          <p
            role="status"
            className="mb-4 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm"
          >
            <Clock className="size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>
              Um pagamento anterior ainda está em processamento.{' '}
              <Link
                to="/pedidos/$orderId"
                params={{ orderId: pendingOrder.id }}
                className="font-semibold underline"
              >
                Acompanhar o pedido
              </Link>
            </span>
          </p>
        )
      }
    />
  )
}

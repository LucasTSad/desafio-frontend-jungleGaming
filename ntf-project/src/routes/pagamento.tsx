import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { previewPay } from '@/dev/preview-checkout'
import { profileQueryOptions, walletsQueryOptions } from '@/features/account/api'
import { toSavedWallets } from '@/features/account/mappers'
import { requireAuth } from '@/features/auth/require-auth'
import { EMPTY_CART, removePurchased, useCart } from '@/features/cart/api'
import { toCatalogStatus } from '@/features/catalog/api'
import { CheckoutView } from '@/features/checkout/components/checkout-view'
import type { CheckoutInput } from '@/features/checkout/schemas'
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
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const { lines, totals, coupon } = cartQuery.cart ?? EMPTY_CART
  const { user } = Route.useRouteContext()
  const { data: profile } = useSuspenseQuery(profileQueryOptions(user.id))
  const { data: wallets } = useSuspenseQuery(walletsQueryOptions(user.id))
  const savedWallets = useMemo(() => toSavedWallets(wallets), [wallets])

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
      onPay={(values, request) =>
        previewPay({
          ...request,
          network: values.network,
          provider: values.provider,
          walletAddress: values.walletAddress,
          onConfirmed: (items) => void removePurchased(queryClient, user.id, items),
        })
      }
      onPlaced={(orderId) => navigate({ to: '/pedidos/$orderId', params: { orderId } })}
      onRetry={() => void cartQuery.refetch()}
    />
  )
}

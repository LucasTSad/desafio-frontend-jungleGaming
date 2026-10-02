import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { usePreviewCart } from '@/dev/preview-cart'
import { previewPay } from '@/dev/preview-checkout'
import { previewDataStatus } from '@/dev/preview-data'
import { profileQueryOptions, walletsQueryOptions } from '@/features/account/api'
import { toSavedWallets } from '@/features/account/mappers'
import { requireAuth } from '@/features/auth/require-auth'
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
  const { lines, totals, coupon } = usePreviewCart()
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
      status={previewDataStatus}
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
        })
      }
      onPlaced={(orderId) => navigate({ to: '/pedidos/$orderId', params: { orderId } })}
      onRetry={() => window.location.reload()}
    />
  )
}

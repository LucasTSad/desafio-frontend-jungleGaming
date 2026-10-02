import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { usePreviewCart } from '@/dev/preview-cart'
import { usePreviewAccount, usePreviewSavedWallets } from '@/dev/preview-account'
import { previewPay } from '@/dev/preview-checkout'
import { previewDataStatus } from '@/dev/preview-data'
import { getCurrentAccount } from '@/dev/preview-session'
import { requireAuth } from '@/features/auth/require-auth'
import { CheckoutView } from '@/features/checkout/components/checkout-view'
import type { CheckoutInput } from '@/features/checkout/schemas'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/pagamento')({
  staticData: { nav: 'market', mobileActionBar: true },
  beforeLoad: ({ location }) => requireAuth(Boolean(getCurrentAccount()), location.href),
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, totals, coupon } = usePreviewCart()
  const profile = usePreviewAccount()?.profile
  const savedWallets = usePreviewSavedWallets()

  useDocumentTitle('Pagamento')

  const defaultValues = useMemo<Partial<CheckoutInput>>(() => {
    const wallet = savedWallets[0]
    return {
      displayName: profile?.displayName ?? '',
      username: profile?.username ?? '',
      profileName: '',
      email: profile?.email ?? '',
      referralCode: '',
      ensName: profile?.ensName ?? '',
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

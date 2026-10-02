import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { usePreviewCart } from '@/dev/preview-cart'
import { previewPay, previewSavedWallets } from '@/dev/preview-checkout'
import { previewDataStatus } from '@/dev/preview-data'
import { usePreviewUser } from '@/dev/preview-session'
import { CheckoutView } from '@/features/checkout/components/checkout-view'
import type { CheckoutInput } from '@/features/checkout/schemas'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/pagamento')({
  staticData: { nav: 'market', mobileActionBar: true },
  component: CheckoutPage,
})

function CheckoutPage() {
  const navigate = useNavigate()
  const { lines, totals, coupon } = usePreviewCart()
  const user = usePreviewUser()

  useDocumentTitle('Pagamento')

  const defaultValues = useMemo<Partial<CheckoutInput>>(() => {
    const wallet = previewSavedWallets[0]
    return {
      displayName: user?.displayName ?? '',
      username: '',
      profileName: '',
      email: '',
      referralCode: '',
      ensName: '',
      secondaryWallet: '',
      note: '',
      walletSource: 'saved',
      savedWalletId: wallet?.id,
      network: wallet?.network,
      walletAddress: wallet?.address ?? '',
      walletType: wallet?.provider,
      provider: wallet?.provider,
    }
  }, [user])

  return (
    <CheckoutView
      status={previewDataStatus}
      lines={lines}
      totals={totals}
      coupon={coupon}
      savedWallets={previewSavedWallets}
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

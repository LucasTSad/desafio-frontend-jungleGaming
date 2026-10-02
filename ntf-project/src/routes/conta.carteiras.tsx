import { createFileRoute } from '@tanstack/react-router'
import { previewAccount, usePreviewAccount } from '@/dev/preview-account'
import { WalletsView } from '@/features/account/components/wallets-view'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/carteiras')({
  component: WalletsPage,
})

function WalletsPage() {
  const account = usePreviewAccount()

  useDocumentTitle('Carteiras')

  if (!account) return null
  return (
    <WalletsView
      profile={account.profile}
      wallets={account.wallets}
      onSaveWallet={previewAccount.saveWallet}
      onSetSecondarySame={previewAccount.setSecondarySameAsPrincipal}
    />
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { previewAccount, usePreviewAccount } from '@/dev/preview-account'
import { ProfileForm } from '@/features/account/components/profile-form'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/perfil')({
  component: ProfilePage,
})

function ProfilePage() {
  const account = usePreviewAccount()

  useDocumentTitle('Perfil do colecionador')

  if (!account) return null
  return <ProfileForm profile={account.profile} onSave={previewAccount.saveProfile} />
}

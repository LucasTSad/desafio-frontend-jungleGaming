import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { profileQueryOptions, useSaveProfile } from '@/features/account/api'
import { ProfileForm } from '@/features/account/components/profile-form'
import { toAccountProfile } from '@/features/account/mappers'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/perfil')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(profileQueryOptions(context.user.id)),
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = Route.useRouteContext()
  const { data } = useSuspenseQuery(profileQueryOptions(user.id))
  const saveProfile = useSaveProfile(user.id)

  useDocumentTitle('Perfil do colecionador')

  return <ProfileForm key={user.id} profile={toAccountProfile(data)} onSave={saveProfile} />
}

import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  profileQueryOptions,
  useWalletMutations,
  walletsQueryOptions,
} from '@/features/account/api'
import { WalletsView } from '@/features/account/components/wallets-view'
import { toAccountProfile, toAccountWallets } from '@/features/account/mappers'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/conta/carteiras')({
  loader: ({ context: { queryClient, user } }) =>
    Promise.all([
      queryClient.ensureQueryData(profileQueryOptions(user.id)),
      queryClient.ensureQueryData(walletsQueryOptions(user.id)),
    ]),
  component: WalletsPage,
})

function WalletsPage() {
  const { user } = Route.useRouteContext()
  const { data: profile } = useSuspenseQuery(profileQueryOptions(user.id))
  const { data: wallets } = useSuspenseQuery(walletsQueryOptions(user.id))
  const { saveWallet, setSecondarySame } = useWalletMutations(user.id)

  useDocumentTitle('Carteiras')

  return (
    <WalletsView
      key={user.id}
      profile={toAccountProfile(profile)}
      wallets={toAccountWallets(wallets)}
      onSaveWallet={saveWallet}
      onSetSecondarySame={setSecondarySame}
    />
  )
}

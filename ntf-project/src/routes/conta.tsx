import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { AccountNav } from '@/features/account/components/account-nav'
import { signOut } from '@/features/auth/api'
import { requireAuth } from '@/features/auth/require-auth'

export const Route = createFileRoute('/conta')({
  staticData: { nav: 'account', hideFooter: true, mobileTabBar: true },
  beforeLoad: requireAuth,
  component: AccountLayout,
})

function AccountLayout() {
  const navigate = useNavigate()

  // Sai da área privada antes de encerrar a sessão para o guard não mandar de volta para Entrar.
  async function leave() {
    await navigate({ to: '/' })
    await signOut()
    toast.success('Você saiu da sua conta.')
  }

  return (
    <>
      <MobileTopBar title="Minha conta" titleAs="p" />
      <div className="page-container grid gap-6 pt-2 pb-12 md:grid-cols-[220px_minmax(0,1fr)] md:gap-[30px] md:pt-[30px] lg:grid-cols-[310px_minmax(0,1fr)]">
        <AccountNav onSignOut={() => void leave()} />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}

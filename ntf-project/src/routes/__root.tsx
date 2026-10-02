import { createRootRouteWithContext, Link, Outlet, useLocation } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { Devtools } from '@/app/devtools'
import { useRouteLayout } from '@/app/route-layout'
import type { RouterContext } from '@/app/router'
import { useRouteFocus } from '@/app/use-route-focus'
import { LiveRegion } from '@/components/layout/live-region'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { ACCOUNT_LINK_ID, SiteHeader } from '@/components/layout/site-header'
import { MAIN_CONTENT_ID, SkipLink } from '@/components/layout/skip-link'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePreviewCart } from '@/dev/preview-cart'
import { useSessionUser, useSignIn, useSignUp } from '@/features/auth/api'
import { AuthDialog } from '@/features/auth/components/auth-dialog'
import { welcomeMessage } from '@/features/auth/messages'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const layout = useRouteLayout()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { count: cartCount } = usePreviewCart()
  const user = useSessionUser()
  const signIn = useSignIn()
  const signUp = useSignUp()
  const [authOpen, setAuthOpen] = useState(false)
  const signedIn = Boolean(user)
  useRouteFocus(MAIN_CONTENT_ID)

  return (
    <TooltipProvider>
      <SkipLink />
      <SiteHeader
        activeNav={layout.nav}
        cartCount={cartCount}
        user={user && { displayName: user.displayName, avatarUrl: user.avatarUrl ?? undefined }}
        onSignIn={layout.hideSignIn ? undefined : () => setAuthOpen(true)}
      />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      {!layout.hideFooter && <SiteFooter />}
      {layout.mobileTabBar && (
        <>
          <div aria-hidden="true" className="h-28 md:hidden" />
          <MobileTabBar
            activeNav={layout.nav}
            pathname={pathname}
            cartCount={cartCount}
            signedIn={signedIn}
          />
        </>
      )}
      <Toaster
        position="bottom-right"
        mobileOffset={{ bottom: layout.mobileTabBar ? 112 : layout.mobileActionBar ? 168 : 16 }}
      />
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSignIn={async (values) => {
          const result = await signIn(values)
          if (result.ok) {
            setAuthOpen(false)
            toast.success(welcomeMessage('sign-in', result.displayName))
          }
          return result
        }}
        onSignUp={async (values) => {
          const result = await signUp(values)
          if (result.ok) {
            setAuthOpen(false)
            toast.success(welcomeMessage('sign-up', result.displayName))
          }
          return result
        }}
        onCloseAutoFocus={(event) => {
          const accountLink = document.getElementById(ACCOUNT_LINK_ID)
          if (!accountLink) return
          event.preventDefault()
          accountLink.focus()
        }}
      />
      <LiveRegion />
      <Devtools />
    </TooltipProvider>
  )
}

function NotFound() {
  useDocumentTitle('Página não encontrada')

  return (
    <>
      <MobileTopBar title="Página não encontrada" titleAs="p" />
      <section className="page-container flex min-h-[60dvh] flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-5xl font-bold text-brand">404</p>
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          O endereço acessado não existe ou foi removido. Confira o link ou volte para o catálogo.
        </p>
        <Button asChild>
          <Link to="/">Voltar ao início</Link>
        </Button>
      </section>
    </>
  )
}

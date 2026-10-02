import { createRootRouteWithContext, Link, Outlet, useLocation } from '@tanstack/react-router'
import { Devtools } from '@/app/devtools'
import { useRouteLayout } from '@/app/route-layout'
import type { RouterContext } from '@/app/router'
import { LiveRegion } from '@/components/layout/live-region'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { MAIN_CONTENT_ID, SkipLink } from '@/components/layout/skip-link'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { usePreviewCart } from '@/dev/preview-cart'
import { usePreviewUser } from '@/dev/preview-session'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const layout = useRouteLayout()
  const pathname = useLocation({ select: (location) => location.pathname })
  const { count: cartCount } = usePreviewCart()
  const user = usePreviewUser()

  return (
    <TooltipProvider>
      <SkipLink />
      <SiteHeader activeNav={layout.nav} cartCount={cartCount} user={user} />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      {!layout.hideFooter && <SiteFooter />}
      {layout.mobileTabBar && (
        <>
          <div aria-hidden="true" className="h-28 md:hidden" />
          <MobileTabBar activeNav={layout.nav} pathname={pathname} cartCount={cartCount} />
        </>
      )}
      <Toaster
        position="bottom-right"
        mobileOffset={{ bottom: layout.mobileTabBar ? 112 : layout.mobileActionBar ? 168 : 16 }}
      />
      <LiveRegion />
      <Devtools />
    </TooltipProvider>
  )
}

function NotFound() {
  return (
    <>
      <MobileTopBar title="Página não encontrada" />
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

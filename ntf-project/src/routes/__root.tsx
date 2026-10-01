import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { Devtools } from '@/app/devtools'
import type { RouterContext } from '@/app/router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Devtools />
    </>
  )
}

function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe ou foi removido.</p>
      <Link to="/" className="underline underline-offset-4">
        Voltar ao início
      </Link>
    </main>
  )
}

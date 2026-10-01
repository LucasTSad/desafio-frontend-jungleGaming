import { lazy, Suspense } from 'react'

const RouterDevtools = lazy(() =>
  import('@tanstack/react-router-devtools').then((m) => ({
    default: m.TanStackRouterDevtools,
  })),
)

const QueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({
    default: m.ReactQueryDevtools,
  })),
)

export function Devtools() {
  if (!import.meta.env.DEV) return null

  return (
    <Suspense fallback={null}>
      <RouterDevtools position="bottom-left" />
      <QueryDevtools buttonPosition="bottom-right" />
    </Suspense>
  )
}

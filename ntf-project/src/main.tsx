import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createQueryClient } from '@/app/query-client'
import { createAppRouter } from '@/app/router'
import { installSessionSync } from '@/app/session-sync'
import './index.css'

/** Com a API simulada ligada, o app só monta depois que o MSW já intercepta as requisições. */
async function enableMocking() {
  if (import.meta.env.VITE_API_MOCKING !== 'enabled') return
  const { startMocking } = await import('@/mocks/browser')
  await startMocking()
}

const queryClient = createQueryClient()
const router = createAppRouter(queryClient)
installSessionSync(queryClient, router)

// O Socket.IO só é carregado depois do MSW: o engine.io-client guarda a referência do WebSocket
// global ao carregar, e ela precisa já ser a versão interceptada pelo mock.
void enableMocking()
  .then(() => import('@/app/realtime'))
  .then(({ installRealtime }) => {
    installRealtime(queryClient)
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </StrictMode>,
    )
  })

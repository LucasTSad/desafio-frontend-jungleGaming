import { setupWorker } from 'msw/browser'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { installMockControl } from './control'
import { handlers } from './handlers'
import { MockPanel } from './panel/mock-panel'
import { startRealtime } from './realtime'

export const worker = setupWorker(...handlers)

/** Liga o service worker do MSW, expõe o controle dos cenários e monta o painel de demonstração. */
export async function startMocking() {
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledRequest: 'bypass',
    quiet: !import.meta.env.DEV,
  })
  installMockControl()
  startRealtime()

  const container = document.createElement('div')
  container.id = 'kurio-mock-panel'
  document.body.append(container)
  createRoot(container).render(createElement(MockPanel))
}

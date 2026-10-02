import { test as base, expect, type Page } from '@playwright/test'
import type { NftChange } from '@/mocks/catalog'
import type { MockControl } from '@/mocks/control'
import type { ScenarioId } from '@/mocks/scenarios'

/** Espera o MSW assumir a página e expor o controle dos cenários. */
export async function waitForMocks(page: Page) {
  await page.waitForFunction(() =>
    Boolean(window.__kurioMock && navigator.serviceWorker.controller),
  )
}

/** Restaura as fixtures e aplica o cenário antes do teste, partindo sempre de um estado isolado. */
export async function resetMocks(page: Page, scenario: ScenarioId = 'padrao') {
  await page.goto('/')
  await waitForMocks(page)
  await page.evaluate((id) => window.__kurioMock!.reset({ scenario: id }), scenario)
  await page.reload()
  await waitForMocks(page)
}

export function mockControl(page: Page) {
  const controls = {
    setScenario: (id: ScenarioId) =>
      page.evaluate((scenario) => window.__kurioMock!.setScenario(scenario), id),
    getScenario: () => page.evaluate(() => window.__kurioMock!.getScenario()),
    advanceClock: (ms: number) =>
      page.evaluate((value) => window.__kurioMock!.advanceClock(value), ms),
    now: () => page.evaluate(() => window.__kurioMock!.now()),
    updateNft: (id: string, change: NftChange) =>
      page.evaluate(([nftId, patch]) => window.__kurioMock!.updateNft(nftId, patch), [
        id,
        change,
      ] as const),
    setRealtimeOnline: (online: boolean) =>
      page.evaluate((value) => window.__kurioMock!.setRealtimeOnline(value), online),
    disconnectWallet: () => page.evaluate(() => window.__kurioMock!.disconnectWallet()),
    realtimeUsers: () => page.evaluate(() => window.__kurioMock!.realtimeUsers()),
  } satisfies Partial<Record<keyof MockControl, unknown>>
  return {
    ...controls,
    /** Espera o socket desta página estar conectado ao servidor de eventos simulado. */
    waitForRealtime: () =>
      page.waitForFunction(() => (window.__kurioMock?.realtimeConnections() ?? 0) > 0),
  }
}

export const test = base.extend<{ mock: ReturnType<typeof mockControl> }>({
  // Automática: todo teste começa com as fixtures restauradas, mesmo sem usar `mock`.
  mock: [
    async ({ page }, use) => {
      await resetMocks(page)
      await use(mockControl(page))
    },
    { auto: true },
  ],
})

export { expect }

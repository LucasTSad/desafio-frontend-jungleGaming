import type { Page } from '@playwright/test'
import { expect, resetMocks, test, waitForMocks } from '../fixtures/mock'

const HEALTH = '/api/v1/health'

/** Faz a requisição pela página, passando pelo service worker do MSW. */
function fetchHealth(page: Page) {
  return page.evaluate(async (url) => {
    const started = performance.now()
    try {
      const response = await fetch(url)
      return {
        ok: true,
        status: response.status,
        body: await response.json(),
        ms: performance.now() - started,
      }
    } catch (error) {
      return { ok: false, error: String(error), ms: performance.now() - started }
    }
  }, HEALTH)
}

test.describe('camada de mocks (MSW)', () => {
  test('o service worker responde à API no cenário padrão', async ({ page, mock }) => {
    const result = await fetchHealth(page)
    expect(result).toMatchObject({
      ok: true,
      status: 200,
      body: { status: 'ok', scenario: 'padrao' },
    })
    expect(await mock.getScenario()).toBe('padrao')
  })

  test('offline simula falha de conexão', async ({ page, mock }) => {
    await mock.setScenario('offline')
    const result = await fetchHealth(page)
    expect(result.ok).toBe(false)
  })

  test('erro no servidor responde 503 com o envelope de erro', async ({ page, mock }) => {
    await mock.setScenario('erro-servidor')
    const result = await fetchHealth(page)
    expect(result).toMatchObject({
      status: 503,
      body: { error: { code: 'SERVICE_UNAVAILABLE', retryable: true } },
    })
  })

  test('instável falha três vezes e funciona na quarta tentativa', async ({ page, mock }) => {
    await mock.setScenario('instavel')
    const statuses = []
    for (let attempt = 0; attempt < 4; attempt++) statuses.push((await fetchHealth(page)).status)
    expect(statuses).toEqual([503, 503, 503, 200])
  })

  test('rede lenta respeita a faixa de latência', async ({ page, mock }) => {
    await mock.setScenario('lento')
    const result = await fetchHealth(page)
    expect(result.ms).toBeGreaterThanOrEqual(1500)
  })

  test('o cenário vem da URL e persiste após recarregar', async ({ page }) => {
    await page.goto('/?cenario=erro-servidor')
    await waitForMocks(page)
    await page.goto('/')
    await waitForMocks(page)
    expect(await page.evaluate(() => window.__kurioMock!.getScenario())).toBe('erro-servidor')
    await resetMocks(page)
    expect(await page.evaluate(() => window.__kurioMock!.getScenario())).toBe('padrao')
  })

  test('reset restaura as fixtures e limpa os dados do app no navegador', async ({
    page,
    mock,
  }) => {
    await mock.advanceClock(60 * 60_000)
    await page.evaluate(() => {
      localStorage.setItem('kurio-session', 'token-antigo')
      sessionStorage.setItem('kurio-pedido-pendente', 'chave')
      localStorage.setItem('outro-app', 'mantido')
    })
    await page.reload()
    await waitForMocks(page)
    expect(await mock.now()).toBeGreaterThan(Date.now() + 59 * 60_000)

    await page.evaluate(() => window.__kurioMock!.reset())
    const storage = await page.evaluate(() => ({
      session: localStorage.getItem('kurio-session'),
      pending: sessionStorage.getItem('kurio-pedido-pendente'),
      other: localStorage.getItem('outro-app'),
    }))
    expect(storage).toEqual({ session: null, pending: null, other: 'mantido' })
    expect(Math.abs((await mock.now()) - Date.now())).toBeLessThan(5_000)
  })

  test('o painel troca o cenário e recarrega a página', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /API simulada, cenário: Padrão/ })
    await trigger.click()
    await page.getByLabel('Cenário', { exact: true }).selectOption('lento')
    await expect(page.getByText('Respostas entre 1,5 s e 3 s')).toBeVisible()
    await page.getByRole('button', { name: 'Aplicar cenário' }).click()
    await page.waitForLoadState('load')
    await waitForMocks(page)
    await expect(
      page.getByRole('button', { name: /API simulada, cenário: Rede lenta/ }),
    ).toBeVisible()
  })

  test('o painel abre e fecha pelo teclado e devolve o foco', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /API simulada/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel('Cenário', { exact: true })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByLabel('Cenário', { exact: true })).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

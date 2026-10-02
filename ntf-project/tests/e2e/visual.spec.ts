import type { Page, TestInfo } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn } from '../fixtures/auth'
import { isMobile } from '../fixtures/catalog'
import { visible } from '../fixtures/checkout'
import { expect, test } from '../fixtures/mock'

/**
 * Espera a página assentar antes da captura: percorre a página para as imagens com carregamento
 * tardio entrarem, espera todas as visíveis carregarem e decodificarem e as fontes carregarem, e
 * volta ao topo.
 */
async function settle(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 60))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => image.checkVisibility())
      .every((image) => image.complete && image.naturalWidth > 0),
  )
  // Com decoding="async", `complete` fica verdadeiro antes de a imagem estar pronta para pintar;
  // numa máquina ocupada, a primeira captura saía sem algumas delas. O decode() só resolve depois.
  await page.evaluate(() =>
    Promise.all(
      [...document.images]
        .filter((image) => image.checkVisibility())
        .map((image) => image.decode().catch(() => undefined)),
    ),
  )
  await page.evaluate(() => document.fonts.ready)
}

/**
 * Na captura da página inteira, o que é fixo fica na altura da primeira tela, por cima do conteúdo.
 * Por isso, no mobile, a primeira tela é capturada com as barras fixas no lugar real e a página
 * inteira sem elas. O painel de cenários some de todas pelo CSS de `toHaveScreenshot.stylePath`.
 */
async function capture(page: Page, testInfo: TestInfo, name: string) {
  await settle(page)
  if (isMobile(testInfo)) await expect(page).toHaveScreenshot(`${name}-tela.png`)
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (getComputedStyle(element).position === 'fixed') element.style.visibility = 'hidden'
    }
  })
  // A página inteira do início no desktop tem 1440 × 3715 px: com 4 workers numa máquina ocupada,
  // as duas capturas iguais seguidas que o Playwright exige passavam dos 10 s padrão.
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, timeout: 30_000 })
}

test.describe('regressão visual', () => {
  test('início', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(page.locator('#mercado article')).toHaveCount(9)
    await capture(page, testInfo, 'inicio')
  })

  test('detalhe do NFT', async ({ page }, testInfo) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
    await capture(page, testInfo, 'detalhe')
  })

  test.describe('com a conta do colecionador', () => {
    // A página é aberta do zero depois do login, sem o aviso de boas-vindas na captura.
    test.beforeEach(async ({ page }) => {
      await signIn(page, ACCOUNTS.colecionador)
    })

    test('carrinho', async ({ page }, testInfo) => {
      await page.goto('/carrinho')
      await expect(
        page.getByRole('article', { name: 'Emerald Ape #042', exact: true }),
      ).toBeVisible()
      await capture(page, testInfo, 'carrinho')
    })

    test('pagamento', async ({ page }, testInfo) => {
      await page.goto('/pagamento')
      await expect(visible(page, 'Confirmar compra')).toBeVisible()
      await capture(page, testInfo, 'pagamento')
    })
  })
})

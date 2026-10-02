import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn } from '../fixtures/auth'
import { cards } from '../fixtures/catalog'
import { expect, test } from '../fixtures/mock'

const skeletons = (page: Page) => page.locator('[data-slot="skeleton"]')

/** Soma os deslocamentos de layout sem interação do usuário (a métrica CLS) desde o carregamento. */
async function trackLayoutShifts(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __layoutShift: number }
    target.__layoutShift = 0
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number
        hadRecentInput: boolean
      })[]) {
        if (!entry.hadRecentInput) target.__layoutShift += entry.value
      }
    }).observe({ type: 'layout-shift', buffered: true })
  })
  return () => page.evaluate(() => (window as unknown as { __layoutShift: number }).__layoutShift)
}

test.describe('rede lenta', () => {
  test.beforeEach(async ({ mock }) => {
    await mock.setScenario('lento')
  })

  test('catálogo mostra um skeleton por card e troca sem deslocar o layout', async ({ page }) => {
    const layoutShift = await trackLayoutShifts(page)
    await page.goto('/')

    const loading = page.getByRole('status', { name: 'Carregando NFTs' })
    await expect(loading).toBeVisible()
    await expect(loading.locator(':scope > *')).toHaveCount(9)
    await expect(cards(page)).toHaveCount(0)

    await expect(cards(page)).toHaveCount(9, { timeout: 15_000 })
    await expect(loading).toHaveCount(0)
    expect(await layoutShift()).toBeLessThan(0.1)
  })

  test('detalhe mostra o skeleton até a resposta chegar, sem deslocar o layout', async ({
    page,
  }) => {
    const layoutShift = await trackLayoutShifts(page)
    await page.goto('/nft/emerald-ape-042')
    const loading = page.getByRole('status', { name: 'Carregando NFT' })
    await expect(loading).toBeVisible()
    await expect(
      loading.locator('[data-slot="skeleton"]').filter({ visible: true }),
    ).not.toHaveCount(0)

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(loading).toHaveCount(0)
    // O rodapé não pode aparecer durante o carregamento e depois ser empurrado para fora da tela.
    expect(await layoutShift()).toBeLessThan(0.05)
  })

  test('carrinho e resumo ficam em skeleton enquanto a API responde', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador)
    await page.goto('/carrinho')

    const items = page.getByRole('region', { name: 'Itens do carrinho' })
    await expect(items).toHaveAttribute('aria-busy', 'true')
    await expect(skeletons(page).first()).toBeVisible()

    await expect(page.getByRole('article', { name: 'Emerald Ape #042', exact: true })).toBeVisible({
      timeout: 15_000,
    })
    await expect(items).toHaveAttribute('aria-busy', 'false')
    await expect(skeletons(page)).toHaveCount(0)
  })

  test('com movimento reduzido o shimmer fica parado', async ({ page }) => {
    const animationOf = () =>
      skeletons(page)
        .first()
        .evaluate((element) => getComputedStyle(element).animationName)

    await page.goto('/')
    await expect(skeletons(page).first()).toBeVisible()
    expect(await animationOf()).toBe('shimmer')

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(skeletons(page).first()).toBeVisible()
    expect(await animationOf()).toBe('none')
  })
})

test('falha ao carregar o detalhe avisa e "Tentar novamente" recupera', async ({ page, mock }) => {
  // "Instável": cada chamada falha 3 vezes. A consulta tenta 3 vezes sozinha e mostra o erro;
  // a nova tentativa pedida pela pessoa é a quarta e funciona.
  await mock.setScenario('instavel')
  await page.goto('/nft/emerald-ape-042')

  const failure = page.getByRole('alert').filter({ hasText: 'Não foi possível carregar este NFT' })
  await expect(failure).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveTitle(/Erro ao carregar NFT/)

  await failure.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
  await expect(failure).toHaveCount(0)
})

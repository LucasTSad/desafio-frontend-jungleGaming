import type { Page } from '@playwright/test'
import { expect, test } from '../fixtures/mock'

const cards = (page: Page) => page.locator('#mercado article')
const cardTitles = (page: Page) => cards(page).locator('h3')
const resultCount = (page: Page) => page.locator('#mercado [aria-live="polite"]')

test.describe('catálogo', () => {
  test('a primeira página vem da API com destaques e filtros', async ({ page }) => {
    await page.goto('/')
    await expect(resultCount(page)).toHaveText('36 NFTs encontrados')
    await expect(cards(page)).toHaveCount(9)
    await expect(cardTitles(page).first()).toHaveText('Emerald Ape #042')
    await expect(page.getByRole('link', { name: 'Ver Emerald Ape #042' })).toBeVisible()
  })

  test('busca, filtro e ordenação seguem a URL', async ({ page }) => {
    await page.goto('/?collections=musica&sort=menor-preco')
    await expect(resultCount(page)).toHaveText('5 NFTs encontrados')
    await expect(cardTitles(page).first()).toHaveText('Saffron Tempo #290')

    await page.goto('/?q=golden')
    await expect(resultCount(page)).toHaveText('2 NFTs encontrados')
    await expect(cardTitles(page)).toHaveText(['Golden Beat #207', 'Golden Signal #160'])
  })

  test('paginação troca os itens e voltar restaura a página anterior', async ({ page }) => {
    await page.goto('/')
    await expect(cardTitles(page).first()).toHaveText('Emerald Ape #042')
    await page.getByRole('link', { name: 'Próxima página' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(cardTitles(page).first()).toHaveText('Jade Monarch #071')

    await page.goBack()
    await expect(cardTitles(page).first()).toHaveText('Emerald Ape #042')
  })

  test('respostas fora de ordem não sobrescrevem a lista atual', async ({ page, mock }) => {
    await mock.setScenario('fora-de-ordem')
    await page.goto('/')
    await expect(cards(page)).toHaveCount(9, { timeout: 15_000 })

    const tabs = page.getByRole('group', { name: 'Listas do catálogo' })
    await tabs.getByRole('button', { name: 'Novos lançamentos' }).click()
    await tabs.getByRole('button', { name: 'Em alta' }).click()
    await expect(page).toHaveURL(/tab=em-alta/)

    await expect(cardTitles(page)).toContainText(['Twilight Scholar #377'], { timeout: 15_000 })
    // Espera além da latência máxima do cenário: uma resposta atrasada de "Novos" não pode aparecer.
    await page.waitForTimeout(3_000)
    await expect(cardTitles(page).filter({ hasText: 'Cosmic Bloom #118' })).toHaveCount(0)
    await expect(cardTitles(page)).toContainText(['Twilight Scholar #377'])
  })

  test('catálogo vazio mostra o estado sem resultados', async ({ page, mock }) => {
    await mock.setScenario('vazio')
    await page.goto('/')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
  })

  test('falha do servidor mostra erro e "Tentar novamente" recupera', async ({ page, mock }) => {
    await mock.setScenario('erro-servidor')
    await page.goto('/')
    await expect(page.getByText('Não foi possível carregar os NFTs')).toBeVisible({
      timeout: 15_000,
    })

    await mock.setScenario('padrao')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(cards(page)).toHaveCount(9)
  })
})

test.describe('detalhe do NFT', () => {
  test('mostra os dados da API, edições e relacionados', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle(/Emerald Ape #042/)
    await expect(page.getByText('1.19 ETH').filter({ visible: true }).first()).toBeVisible()
  })

  test('id inexistente mostra "NFT não encontrado"', async ({ page }) => {
    await page.goto('/nft/nao-existe-123')
    await expect(page.getByRole('heading', { level: 1, name: 'NFT não encontrado' })).toBeVisible()
  })
})

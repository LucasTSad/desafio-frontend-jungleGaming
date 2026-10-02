import {
  cards,
  cardTitles,
  isMobile,
  openFilters,
  resultCount,
  searchFor,
  searchParams,
  sortBy,
} from '../fixtures/catalog'
import { expect, test } from '../fixtures/mock'

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

  test('filtros combinados e ordenação vão para a URL e o histórico restaura cada passo', async ({
    page,
  }, testInfo) => {
    const mobile = isMobile(testInfo)
    await page.goto('/')
    await expect(resultCount(page)).toHaveText('36 NFTs encontrados')

    const filters = await openFilters(page, mobile)
    await filters.getByRole('button', { name: /^Arte digital/ }).click()
    await expect(resultCount(page)).toHaveText('5 NFTs encontrados')
    await filters.getByRole('button', { name: /^Fotografia/ }).click()
    await expect(resultCount(page)).toHaveText('9 NFTs encontrados')
    await filters.getByRole('button', { name: /^Ethereum/ }).click()
    await expect(resultCount(page)).toHaveText('4 NFTs encontrados')
    await expect(filters.getByRole('button', { name: /^Ethereum/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await sortBy(page, 'Maior preço')
    if (mobile) await page.getByRole('button', { name: 'Ver 4 resultados' }).click()

    await expect(cardTitles(page)).toHaveText([
      'Ivy Regent #011',
      'Ivory Baron #088',
      'Emerald Ape #042',
      'Pine Collector #063',
    ])
    expect(Object.fromEntries(searchParams(page))).toEqual({
      collections: 'arte-digital,fotografia',
      networks: 'ethereum',
      sort: 'maior-preco',
    })

    await page.goBack()
    await expect(cards(page)).toHaveCount(4)
    expect(searchParams(page).get('sort')).toBeNull()
    await expect(cardTitles(page).first()).not.toHaveText('Ivy Regent #011')
    await page.goBack()
    await expect(resultCount(page)).toHaveText('9 NFTs encontrados')
    await page.goBack()
    await expect(resultCount(page)).toHaveText('5 NFTs encontrados')
    await page.goBack()
    await expect(resultCount(page)).toHaveText('36 NFTs encontrados')

    await page.goForward()
    await page.goForward()
    await expect(resultCount(page)).toHaveText('9 NFTs encontrados')
    const applied = page.getByRole('group', { name: 'Filtros aplicados' })
    await applied.getByRole('button', { name: 'Remover filtro Arte digital' }).click()
    await expect(resultCount(page)).toHaveText('4 NFTs encontrados')
    expect(searchParams(page).get('collections')).toBe('fotografia')
  })

  test('busca pelo campo e voltar restaura a lista anterior', async ({ page }, testInfo) => {
    await page.goto('/')
    await expect(resultCount(page)).toHaveText('36 NFTs encontrados')

    await searchFor(page, 'nomad', isMobile(testInfo))
    await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
    await expect(cardTitles(page)).toContainText(['Sage Nomad #009'])
    expect(searchParams(page).get('q')).toBe('nomad')

    await page.goBack()
    await expect(resultCount(page)).toHaveText('36 NFTs encontrados')
    await page.goForward()
    await expect(resultCount(page)).toHaveText('3 NFTs encontrados')
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

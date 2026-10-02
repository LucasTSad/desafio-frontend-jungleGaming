import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn } from '../fixtures/auth'
import { expect, test } from '../fixtures/mock'

const summary = (page: Page) => page.getByRole('region', { name: 'Resumo da carteira' })
const cartLine = (page: Page, name: string) => page.locator('main article', { hasText: name })
/** Valor do seletor de quantidade da linha (o `<output>` visível). */
const lineQuantity = (page: Page, name: string) =>
  cartLine(page, name).locator('output').filter({ visible: true })
const visible = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).filter({ visible: true })

const buyButton = (page: Page) => visible(page, /^(COMPRAR|Comprar NFT)$/).first()

/** Compra pela tela de detalhe (adiciona e vai ao carrinho), na edição padrão ou na informada. */
async function addFromDetail(
  page: Page,
  nftId: string,
  options: { edition?: string; extra?: number } = {},
) {
  await page.goto(`/nft/${nftId}`)
  if (options.edition) {
    await page.getByRole('radio', { name: options.edition, exact: true }).first().click()
  }
  for (let index = 0; index < (options.extra ?? 0); index++) {
    await visible(page, /^Aumentar quantidade/)
      .first()
      .click()
  }
  await buyButton(page).click()
  await expect(page).toHaveURL('/carrinho')
}

test.describe('carrinho do visitante', () => {
  test('adicionar pelo detalhe cria o carrinho na API e sobrevive ao recarregar', async ({
    page,
  }) => {
    await addFromDetail(page, 'golden-beat-207')
    expect(await page.evaluate(() => localStorage.getItem('kurio-cart-id'))).toMatch(
      /^[0-9a-f-]{36}$/,
    )

    await expect(cartLine(page, 'Golden Beat #207')).toBeVisible()
    await page.reload()
    await expect(cartLine(page, 'Golden Beat #207')).toBeVisible()
    await expect(summary(page).getByText('1.006 ETH')).toBeVisible()
  })

  test('ao entrar, o carrinho do visitante se junta ao da conta com ajuste ao disponível', async ({
    page,
  }) => {
    // A conta já tem 2 unidades da edição 1/50; com mais 9 passaria do limite de 10 por pedido.
    await addFromDetail(page, 'emerald-ape-042', { extra: 8 })
    await expect(lineQuantity(page, 'Emerald Ape #042')).toHaveText('9')
    await addFromDetail(page, 'golden-beat-207')

    await signIn(page, ACCOUNTS.colecionador, '/carrinho')
    await expect(page.getByText(/Ajustamos as quantidades ao disponível/)).toBeVisible()
    await expect(cartLine(page, 'Golden Beat #207')).toBeVisible()
    await expect(cartLine(page, 'Violet Nomad #314')).toBeVisible()
    await expect(lineQuantity(page, 'Emerald Ape #042')).toHaveText('10')
    expect(await page.evaluate(() => localStorage.getItem('kurio-cart-id'))).toBeNull()
  })
})

test.describe('carrinho da conta', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/carrinho')
    await expect(summary(page).getByText('26.846 ETH')).toBeVisible()
  })

  test('quantidade e remoção recalculam os totais e persistem', async ({ page }) => {
    const emerald = cartLine(page, 'Emerald Ape #042')
    await emerald
      .getByRole('button', { name: /^Aumentar quantidade/ })
      .filter({ visible: true })
      .click()
    await expect(summary(page).getByText('28.036 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Violet Nomad #314 do carrinho' }).click()
    await expect(cartLine(page, 'Violet Nomad #314')).toHaveCount(0)
    await expect(summary(page).getByText('19.696 ETH')).toBeVisible()

    await page.reload()
    await expect(summary(page).getByText('19.696 ETH')).toBeVisible()
    await expect(cartLine(page, 'Violet Nomad #314')).toHaveCount(0)
  })

  test('cliques rápidos com respostas fora de ordem terminam na última quantidade', async ({
    page,
    mock,
  }) => {
    await mock.setScenario('fora-de-ordem')
    const increase = cartLine(page, 'Emerald Ape #042')
      .getByRole('button', { name: /^Aumentar quantidade/ })
      .filter({ visible: true })
    for (let click = 0; click < 3; click++) await increase.click()
    const quantity = lineQuantity(page, 'Emerald Ape #042')
    await expect(quantity).toHaveText('5')

    await expect(summary(page).getByText('30.416 ETH')).toBeVisible({ timeout: 20_000 })
    await mock.setScenario('padrao')
    await page.reload()
    await expect(quantity).toHaveText('5')
  })

  test('cupom válido, inválido, vencido e o cenário de cupom expirado', async ({ page, mock }) => {
    const input = page.getByLabel('Código promocional')
    const apply = summary(page).getByRole('button', { name: /Aplicar/ })

    await input.fill('NAOEXISTE')
    await apply.click()
    await expect(summary(page).getByRole('alert')).toHaveText(/Cupom inválido/)

    await input.fill('GENESIS')
    await apply.click()
    await expect(summary(page).getByRole('alert')).toHaveText(/expirou/)

    await input.fill('kurio10')
    await apply.click()
    await expect(summary(page).getByText('KURIO10')).toBeVisible()
    await expect(summary(page).getByText('24.163 ETH')).toBeVisible()

    await summary(page).getByRole('button', { name: 'Remover' }).click()
    await expect(summary(page).getByText('26.846 ETH')).toBeVisible()

    await mock.setScenario('cupom-expirado')
    await input.fill('KURIO10')
    await apply.click()
    await expect(summary(page).getByRole('alert')).toHaveText(/expirou/)
  })

  test('preço alterado exige confirmação antes de finalizar', async ({ page, mock }) => {
    await mock.updateNft('emerald-ape-042', { priceEth: '1.29' })
    await page.reload()

    await expect(
      page.getByText('Emerald Ape #042: o preço mudou de 1.19 ETH para 1.29 ETH.'),
    ).toBeVisible()
    const checkout = summary(page).getByRole('button', { name: 'Conectar e finalizar' })
    await expect(checkout).toBeDisabled()
    await expect(summary(page).getByText('Confirme os novos preços para continuar.')).toBeVisible()

    await page.getByRole('button', { name: 'Aceitar novo preço' }).click()
    await expect(page.getByText('Atualizamos seu carrinho')).toHaveCount(0)
    await expect(checkout).toBeEnabled()
    await expect(summary(page).getByText('27.046 ETH')).toBeVisible()
  })

  test('edição esgotada fica indisponível e bloqueia o checkout', async ({ page, mock }) => {
    await mock.updateNft('ivory-baron-088', { editions: { aberta: 0 } })
    await page.reload()

    await expect(page.getByText('Ivory Baron #088 (ABERTA) ficou indisponível.')).toBeVisible()
    await expect(summary(page).getByRole('button', { name: 'Conectar e finalizar' })).toBeDisabled()
    await expect(summary(page).getByText('10.736 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover Ivory Baron #088 do carrinho' }).click()
    await expect(summary(page).getByRole('button', { name: 'Conectar e finalizar' })).toBeEnabled()
  })
})

test('adicionar acima do disponível mostra o limite e não altera o carrinho', async ({ page }) => {
  await addFromDetail(page, 'sage-nomad-009', { edition: '1/1' })
  await page.goto('/nft/sage-nomad-009')
  await page.getByRole('radio', { name: '1/1', exact: true }).first().click()
  await buyButton(page).click()
  await expect(
    page.getByText('Esta edição não tem mais unidades disponíveis para o seu carrinho.').first(),
  ).toBeVisible()
  await expect(page).toHaveURL('/nft/sage-nomad-009')

  await page.goto('/carrinho')
  await expect(lineQuantity(page, 'Sage Nomad #009')).toHaveText('1')
})

test('o pagamento usa os itens e o total do carrinho da API', async ({ page }, testInfo) => {
  await signIn(page, ACCOUNTS.colecionador, '/pagamento')
  if (testInfo.project.name === 'mobile') {
    // No mobile o resumo fica num acordeão fechado, com a contagem de itens no título.
    await page.getByRole('button', { name: 'Resumo do pedido (3)' }).click()
  }
  await expect(page.getByText('Emerald Ape #042').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('26.846 ETH').filter({ visible: true }).first()).toBeVisible()
})

import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn, signOut } from '../fixtures/auth'
import { expect, test } from '../fixtures/mock'

const visible = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).filter({ visible: true })
const review = (page: Page) => page.getByRole('dialog', { name: 'Revisar compra' })
const payButton = (page: Page) => review(page).getByRole('button', { name: /^Confirmar e pagar/ })
const confirmedHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })

/** Preenche o que falta no formulário (o resto vem do perfil) e abre a revisão. */
async function openReview(page: Page) {
  await expect(visible(page, 'Confirmar compra')).toBeVisible()
  const collector = page.getByRole('button', { name: 'Dados do colecionador' })
  if (await collector.isVisible()) await collector.click()
  await page.getByLabel('Nome do perfil').fill('Coleção principal')
  await page.getByLabel('Código de indicação').fill('KURIO-2026')
  await visible(page, 'Confirmar compra').click()
  await expect(review(page)).toBeVisible()
}

async function placeOrder(page: Page) {
  await payButton(page).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  return page.url().split('/').pop()!
}

const storedOrders = (page: Page) =>
  page.evaluate(
    () =>
      Object.values(
        (JSON.parse(localStorage.getItem('kurio-mock-db') ?? '{}') as { orders?: object }).orders ??
          {},
      ).length,
  )

test.describe('checkout com a conta do colecionador', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/pagamento')
  })

  test('paga, acompanha o pedido até confirmar e esvazia o carrinho', async ({ page }) => {
    await openReview(page)
    await expect(payButton(page)).toHaveText('Confirmar e pagar 26.846 ETH')
    await placeOrder(page)

    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação na rede' }),
    ).toBeVisible()
    await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })

    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('a revisão usa a taxa da rede da carteira escolhida', async ({ page }) => {
    await page.getByRole('radio', { name: /Reserva/ }).click()
    await openReview(page)
    await expect(review(page).getByText('0.004 ETH')).toBeVisible()
    await expect(payButton(page)).toHaveText('Confirmar e pagar 26.834 ETH')
  })

  test('pedido pendente aparece ao voltar ao pagamento', async ({ page, mock }) => {
    await openReview(page)
    const orderId = await placeOrder(page)
    // Volta o relógio do mock para o pedido continuar pendente durante a verificação.
    await mock.advanceClock(-60_000)

    await page.goto('/pagamento')
    await expect(page.getByText('Um pagamento anterior ainda está em processamento.')).toBeVisible()
    await page.getByRole('link', { name: 'Acompanhar o pedido' }).click()
    await expect(page).toHaveURL(`/pedidos/${orderId}`)

    // O resultado é decidido na criação: trocar de cenário depois não recusa o pedido.
    await mock.setScenario('pagamento-recusado')
    await mock.advanceClock(60_000)
    await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })
  })

  test('carteira recusada mostra o motivo e permite tentar de novo', async ({ page, mock }) => {
    await mock.setScenario('carteira-recusada')
    await openReview(page)
    await payButton(page).click()
    await expect(review(page).getByRole('alert')).toHaveText(/A conexão foi recusada na carteira/)

    await review(page).getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  })

  test('preço alterado no pagamento pede confirmação do novo total', async ({ page, mock }) => {
    await mock.setScenario('preco-alterado')
    await openReview(page)
    await payButton(page).click()

    const alert = review(page).getByRole('alert')
    await expect(alert).toContainText('O total mudou')
    await expect(alert).toContainText(
      'O preço de Emerald Ape #042 mudou de 1.19 ETH para 1.29 ETH.',
    )
    await expect(alert).toContainText('Novo total: 27.046 ETH (antes 26.846 ETH)')

    await review(page).getByRole('button', { name: 'Confirmar novo total' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
    expect(await storedOrders(page)).toBe(1)
  })

  test('edição esgotada no pagamento interrompe a compra', async ({ page, mock }) => {
    await mock.setScenario('edicao-esgotada')
    await openReview(page)
    await payButton(page).click()

    await expect(review(page).getByRole('alert')).toHaveText(
      /Emerald Ape #042 \(1\/50\) não tem mais unidades suficientes/,
    )
    expect(await storedOrders(page)).toBe(0)
  })

  test('resposta perdida ao criar o pedido não duplica a compra', async ({ page, mock }) => {
    await mock.setScenario('timeout-pedido')
    await openReview(page)
    const orderId = await placeOrder(page)

    expect(await storedOrders(page)).toBe(1)
    await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(`/pedidos/${orderId}`)
  })

  test('pagamento recusado mantém os itens no carrinho', async ({ page, mock }) => {
    await mock.setScenario('pagamento-recusado')
    await openReview(page)
    await placeOrder(page)

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText(/saldo insuficiente/)).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByRole('article', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
  })

  test('o pedido de outra conta não é exibido', async ({ page }) => {
    await openReview(page)
    const orderId = await placeOrder(page)

    await signOut(page)
    await signIn(page, ACCOUNTS.curadora, `/pedidos/${orderId}`)
    await expect(page.getByRole('heading', { name: 'Pedido não encontrado' })).toBeVisible()
  })
})

test('depois de comprada, a edição 1/1 fica esgotada', async ({ page }) => {
  await signIn(page, ACCOUNTS.colecionador, '/nft/sage-nomad-009')
  await page.getByRole('radio', { name: '1/1', exact: true }).first().click()
  await visible(page, /^(COMPRAR|Comprar NFT)$/)
    .first()
    .click()
  await expect(page).toHaveURL('/carrinho')

  await page.goto('/pagamento')
  await openReview(page)
  await placeOrder(page)
  await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })

  await page.goto('/nft/sage-nomad-009')
  await expect(page.getByRole('radio', { name: '1/1, esgotada' }).first()).toBeDisabled()
})

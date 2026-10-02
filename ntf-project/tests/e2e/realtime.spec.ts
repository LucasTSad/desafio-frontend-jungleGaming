import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn, signOut } from '../fixtures/auth'
import {
  confirmedHeading,
  openReview,
  payButton,
  placeOrder,
  review,
  visible,
} from '../fixtures/checkout'
import { expect, mockControl, test, waitForMocks } from '../fixtures/mock'

/** A live region educada, onde chegam os avisos de mudança vindos dos eventos. */
const politeRegion = (page: Page) => page.locator('[role="status"][aria-live="polite"]')
const priceBanner = (page: Page, from: string, to: string) =>
  page.getByText(`Emerald Ape #042: o preço mudou de ${from} ETH para ${to} ETH.`)

async function openDetail(page: Page) {
  await page.goto('/nft/golden-beat-207')
  await expect(page.getByRole('heading', { level: 1, name: 'Golden Beat #207' })).toBeVisible()
  await expect(page.getByText('0.99 ETH').filter({ visible: true }).first()).toBeVisible()
}

async function openAccountCart(page: Page) {
  await signIn(page, ACCOUNTS.colecionador, '/carrinho')
  await expect(page.getByText('26.846 ETH').filter({ visible: true }).first()).toBeVisible()
}

test('nft.updated atualiza o detalhe aberto sem recarregar e avisa', async ({ page, mock }) => {
  await openDetail(page)
  await mock.waitForRealtime()

  await mock.updateNft('golden-beat-207', { priceEth: '1.25' })
  await expect(page.getByText('1.25 ETH').filter({ visible: true }).first()).toBeVisible()
  await expect(politeRegion(page)).toHaveText('O preço de Golden Beat #207 mudou para 1.25 ETH.')
})

test('mudança feita em outra aba chega pelo socket', async ({ page, mock, context }) => {
  await openDetail(page)
  await mock.waitForRealtime()

  const other = await context.newPage()
  await other.goto('/')
  await waitForMocks(other)
  await mockControl(other).updateNft('golden-beat-207', { editions: { '1-1': 0 } })

  await expect(page.getByRole('radio', { name: '1/1, esgotada' }).first()).toBeDisabled()
  await expect(politeRegion(page)).toHaveText(
    'A disponibilidade de Golden Beat #207 foi atualizada.',
  )
})

test('pedido confirmado chega pelo evento, sem consultar a API de novo', async ({ page, mock }) => {
  const orderReads: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'GET' && /\/orders\/ord_\d+$/.test(request.url())) {
      orderReads.push(request.url())
    }
  })
  await signIn(page, ACCOUNTS.colecionador, '/pagamento')
  await mock.waitForRealtime()
  await openReview(page)
  await placeOrder(page)

  await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })
  expect(orderReads).toHaveLength(1)
})

test('ao reconectar, as telas buscam o que mudou enquanto o socket esteve fora', async ({
  page,
  mock,
}) => {
  await openAccountCart(page)
  await mock.waitForRealtime()

  await mock.setRealtimeOnline(false)
  await mock.updateNft('emerald-ape-042', { priceEth: '1.29' })
  await page.waitForTimeout(1_000)
  await expect(priceBanner(page, '1.19', '1.29')).toHaveCount(0)

  await mock.setRealtimeOnline(true)
  await expect(priceBanner(page, '1.19', '1.29')).toBeVisible({ timeout: 20_000 })
})

test('eventos repetidos e fora de ordem não voltam o preço nem repetem o aviso', async ({
  page,
  mock,
}) => {
  await openAccountCart(page)
  await mock.waitForRealtime()
  await mock.setScenario('eventos-duplicados')

  await mock.updateNft('emerald-ape-042', { priceEth: '1.29' })
  await expect(priceBanner(page, '1.19', '1.29')).toBeVisible()
  await mock.updateNft('emerald-ape-042', { priceEth: '1.39' })
  await expect(politeRegion(page)).toHaveText('O preço de Emerald Ape #042 mudou para 1.39 ETH.')

  // A repetição e o evento antigo (1.29) chegam logo depois e precisam ser descartados.
  const announced: string[] = []
  await page.exposeFunction('recordAnnouncement', (text: string) => announced.push(text))
  await page.evaluate(() => {
    const region = document.querySelector('[role="status"][aria-live="polite"]')!
    new MutationObserver(() => {
      const text = region.textContent ?? ''
      if (text)
        (window as unknown as { recordAnnouncement: (t: string) => void }).recordAnnouncement(text)
    }).observe(region, { childList: true, subtree: true, characterData: true })
  })
  await page.waitForTimeout(1_000)
  expect(announced).toEqual([])
  await expect(priceBanner(page, '1.19', '1.39')).toBeVisible()
})

test('carteira desconectada durante o pagamento pede nova conexão', async ({ page, mock }) => {
  await signIn(page, ACCOUNTS.colecionador, '/pagamento')
  await mock.waitForRealtime()
  // O preço muda no pagamento: a carteira já conectou e a revisão pede nova confirmação.
  await mock.setScenario('preco-alterado')
  await openReview(page)
  await payButton(page).click()
  await expect(review(page).getByRole('alert')).toContainText('O total mudou')

  await mock.disconnectWallet()
  await expect(
    page.getByText(
      'A carteira foi desconectada. Confirme novamente para reconectar e continuar o pagamento.',
    ),
  ).toBeVisible()

  await review(page).getByRole('button', { name: 'Confirmar novo total' }).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  const connections = await page.evaluate(
    () =>
      Object.keys(
        (
          JSON.parse(localStorage.getItem('kurio-mock-db') ?? '{}') as {
            walletConnections?: object
          }
        ).walletConnections ?? {},
      ).length,
  )
  expect(connections).toBe(2)
})

test.describe('no checkout', () => {
  test.beforeEach(async ({ page, mock }) => {
    await signIn(page, ACCOUNTS.colecionador, '/pagamento')
    await mock.waitForRealtime()
  })

  test('edição esgotada por evento bloqueia o pagamento na hora', async ({ page, mock }) => {
    await expect(visible(page, 'Confirmar compra')).toBeVisible()
    await mock.updateNft('ivory-baron-088', { editions: { aberta: 0 } })

    await expect(page.getByText('Há itens indisponíveis no carrinho.')).toBeVisible()
    await expect(politeRegion(page)).toHaveText(
      'A disponibilidade de Ivory Baron #088 foi atualizada.',
    )
  })

  test('preço alterado por evento com a revisão aberta pede o novo total', async ({
    page,
    mock,
  }) => {
    await openReview(page)
    await mock.updateNft('emerald-ape-042', { priceEth: '1.29' })
    await expect(politeRegion(page)).toHaveText('O preço de Emerald Ape #042 mudou para 1.29 ETH.')

    await payButton(page).click()
    await expect(review(page).getByRole('alert')).toContainText(
      'Novo total: 27.046 ETH (antes 26.846 ETH)',
    )
  })

  test('pedido pendente é retomado pela API enquanto o socket está fora', async ({
    page,
    mock,
  }) => {
    await openReview(page)
    await placeOrder(page)
    await mock.advanceClock(-60_000)
    await mock.setRealtimeOnline(false)

    // Sem o evento, a tela volta a consultar o pedido e encontra a confirmação.
    await mock.advanceClock(60_000)
    await expect(confirmedHeading(page)).toBeVisible({ timeout: 15_000 })
  })
})

test('a conexão em tempo real acompanha a sessão', async ({ page, mock }) => {
  await page.goto('/')
  await mock.waitForRealtime()
  await expect.poll(() => mock.realtimeUsers()).toEqual([null])

  await signIn(page, ACCOUNTS.colecionador)
  await expect.poll(() => mock.realtimeUsers()).toEqual(['usr_colecionador'])

  await signOut(page)
  await signIn(page, ACCOUNTS.curadora)
  await expect.poll(() => mock.realtimeUsers()).toEqual(['usr_curadora'])
})

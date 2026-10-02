import AxeBuilder from '@axe-core/playwright'
import type { Locator, Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn } from '../fixtures/auth'
import { isMobile } from '../fixtures/catalog'
import { openReview, review, visible } from '../fixtures/checkout'
import { expect, test } from '../fixtures/mock'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

const holdsFocus = (container: Locator) =>
  container.evaluate((element) => element.contains(document.activeElement))

/**
 * Indicador de foco visível: contorno ou anel (box-shadow) no elemento focado ou num pseudo-elemento
 * dele (o link do card desenha o contorno no ::after, que cobre o card inteiro).
 */
const focusIndicator = (page: Page) =>
  page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body) return null
    const drawn = [null, '::before', '::after'].some((pseudo) => {
      const style = getComputedStyle(active, pseudo)
      const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0
      return outline || style.boxShadow !== 'none'
    })
    return { element: active.outerHTML.slice(0, 120), visible: drawn }
  })

async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    // A regra do nome que contém o texto visível (WCAG 2.5.3) é experimental no axe e precisa ser
    // ligada à parte; `options` vem antes de `withTags` porque substitui as opções inteiras.
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .withTags(WCAG_TAGS)
    .analyze()
  const summary = violations.map(({ id, impact, nodes }) => ({
    id,
    impact,
    targets: nodes.map((node) => node.target.join(' ')),
  }))
  expect(summary).toEqual([])
}

test.describe('teclado e foco', () => {
  test('o primeiro Tab mostra o atalho que leva ao conteúdo principal', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#mercado article')).toHaveCount(9)
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()

    await page.keyboard.press('Enter')
    await expect(page.locator('#conteudo')).toBeFocused()
  })

  test('cada elemento alcançado pelo Tab tem foco visível', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#mercado article')).toHaveCount(9)
    for (let step = 0; step < 25; step++) {
      await page.keyboard.press('Tab')
      const focus = await focusIndicator(page)
      expect(focus, `Tab ${step + 1}`).not.toBeNull()
      expect(focus!.visible, focus!.element).toBe(true)
    }
  })

  test('diálogo de acesso (desktop) e drawer de filtros (mobile) prendem e devolvem o foco', async ({
    page,
  }, testInfo) => {
    await page.goto('/')
    const { trigger, dialog } = isMobile(testInfo)
      ? {
          trigger: page.getByRole('button', { name: /^Filtros/ }).filter({ visible: true }),
          dialog: page.getByRole('dialog', { name: 'Filtros' }),
        }
      : {
          trigger: page.getByRole('button', { name: 'Entrar' }),
          dialog: page.getByRole('dialog', { name: 'Acesse sua conta Kurio' }),
        }

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(dialog).toBeVisible()
    await expect.poll(() => holdsFocus(dialog)).toBe(true)

    for (let step = 0; step < 20; step++) {
      await page.keyboard.press(step < 15 ? 'Tab' : 'Shift+Tab')
      expect(await holdsFocus(dialog), `tecla ${step + 1}`).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('a revisão da compra prende o foco e o devolve ao botão que a abriu', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/pagamento')
    await openReview(page)
    await expect.poll(() => holdsFocus(review(page))).toBe(true)

    for (let step = 0; step < 12; step++) {
      await page.keyboard.press('Tab')
      expect(await holdsFocus(review(page)), `Tab ${step + 1}`).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(review(page)).toBeHidden()
    await expect(visible(page, 'Confirmar compra')).toBeFocused()
  })

  test('edição, quantidade e compra funcionam só pelo teclado', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    const editions = page.getByRole('radiogroup', { name: 'Edição:' }).filter({ visible: true })
    await editions.getByRole('radio', { name: '1/50' }).focus()
    // O Radix marca o rádio quando o foco chega com a seta ainda pressionada, como numa pessoa real.
    await page.keyboard.press('ArrowRight', { delay: 50 })
    await expect(editions.getByRole('radio', { name: 'ABERTA' })).toBeChecked()
    await expect(editions.getByRole('radio', { name: 'ABERTA' })).toBeFocused()

    const stepper = page
      .getByRole('group', { name: 'Quantidade de Emerald Ape #042' })
      .filter({ visible: true })
    await stepper.getByRole('button', { name: 'Aumentar quantidade' }).focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Space')
    await expect(stepper).toContainText('3')

    await visible(page, /^(COMPRAR|Comprar NFT)$/)
      .first()
      .focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL('/carrinho')
    const line = page.getByRole('article', { name: 'Emerald Ape #042', exact: true })
    await expect(line).toContainText('ABERTA')
    await expect(
      line.getByRole('group', { name: 'Quantidade de Emerald Ape #042' }).filter({ visible: true }),
    ).toContainText('3')
  })
})

test.describe('validação de formulários', () => {
  test('cadastro liga cada erro ao seu campo e limpa ao corrigir', async ({ page }) => {
    await page.goto('/cadastro')
    const form = page.locator('form')
    const username = form.getByLabel('Nome de usuário')
    const email = form.getByLabel('E-mail')
    const password = form.getByLabel('Senha', { exact: true })
    const confirm = form.getByLabel('Confirmar senha')

    await form.getByRole('button', { name: /Criar/ }).click()
    await expect(username).toBeFocused()
    await expect(username).toHaveAttribute('aria-invalid', 'true')
    await expect(username).toHaveAccessibleDescription('Informe um nome de usuário.')
    await expect(email).toHaveAccessibleDescription('Informe seu e-mail.')

    await username.fill('ab')
    await email.fill('pessoa@')
    await password.fill('curta1')
    await confirm.fill('outra123')
    await expect(username).toHaveAccessibleDescription('Use pelo menos 3 caracteres.')
    await expect(email).toHaveAccessibleDescription(
      'Digite um e-mail válido, como nome@exemplo.com.',
    )
    await expect(password).toHaveAccessibleDescription(
      /A senha precisa ter pelo menos 8 caracteres\./,
    )
    await expect(confirm).toHaveAccessibleDescription('As senhas não coincidem.')

    await username.fill('pessoa_nova')
    await email.fill('pessoa.nova@kurio.dev')
    await password.fill('Novidade2026')
    await confirm.fill('Novidade2026')
    for (const field of [username, email, password, confirm]) {
      await expect(field).not.toHaveAttribute('aria-invalid')
    }
  })

  test('pagamento leva o foco ao primeiro campo inválido', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/pagamento')
    await expect(visible(page, 'Confirmar compra')).toBeVisible()
    const collector = page.getByRole('button', { name: 'Dados do colecionador' })
    if (await collector.isVisible()) await collector.click()
    const profileName = page.getByLabel('Nome do perfil')
    const referral = page.getByLabel('Código de indicação')
    await profileName.fill('')
    await referral.fill('kr')

    await visible(page, 'Confirmar compra').click()
    await expect(profileName).toBeFocused()
    await expect(profileName).toHaveAccessibleDescription('Informe o nome do perfil.')
    await expect(referral).toHaveAccessibleDescription('Use de 4 a 16 letras, números ou hífen.')
    await expect(review(page)).toBeHidden()
  })
})

test.describe('axe (WCAG 2.2 A/AA)', () => {
  test('início, detalhe e acesso', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#mercado article')).toHaveCount(9)
    await expectNoAxeViolations(page)

    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expectNoAxeViolations(page)

    await page.goto('/entrar')
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expectNoAxeViolations(page)
  })

  test('carrinho, pagamento, revisão e conta', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/carrinho')
    await expect(page.getByRole('article', { name: 'Emerald Ape #042', exact: true })).toBeVisible()
    await expectNoAxeViolations(page)

    await page.goto('/pagamento')
    await openReview(page)
    await expectNoAxeViolations(page)

    await page.goto('/conta/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
    await expectNoAxeViolations(page)

    await page.goto('/conta/carteiras')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoAxeViolations(page)
  })
})

import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { fillSignIn, signIn, signOut } from '../fixtures/auth'
import { expect, test } from '../fixtures/mock'

const PRINCIPAL_ADDRESS = '0xA91F4c2D7e3B5a6C8d9E0f1A2b3C4d5E6f7AE82C'

async function openProfile(page: Page) {
  await signIn(page, ACCOUNTS.colecionador, '/conta/perfil')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
}

/** PNG gerado pelo próprio navegador, para testar o envio de avatar sem arquivos binários no repo. */
async function pngFile(page: Page, size: number) {
  const base64 = await page.evaluate((side) => {
    const canvas = document.createElement('canvas')
    canvas.width = side
    canvas.height = side
    const context = canvas.getContext('2d')!
    context.fillStyle = '#d38a4f'
    context.fillRect(0, 0, side, side)
    return canvas.toDataURL('image/png').split(',')[1]!
  }, size)
  return { name: 'avatar.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

test.describe('perfil', () => {
  test('alterações do perfil persistem após recarregar', async ({ page }) => {
    await openProfile(page)
    await page.getByLabel('Nome de exibição').fill('Colecionador Kurio')
    await page.getByLabel('Apelido da carteira').fill('Cofre')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador Kurio')
    await expect(page.getByLabel('Apelido da carteira')).toHaveValue('Cofre')
  })

  test('nome de usuário de outra conta é recusado no campo', async ({ page }) => {
    await openProfile(page)
    await page.getByLabel('Nome de usuário').fill('curadora')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(page.getByLabel('Nome de usuário')).toBeFocused()
  })

  test('avatar inválido é recusado e o válido persiste', async ({ page }) => {
    await openProfile(page)
    const input = page.locator('input[type="file"]')
    await input.setInputFiles({
      name: 'notas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('não é imagem'),
    })
    await expect(page.getByText('Formato não suportado.')).toBeVisible()

    await input.setInputFiles(await pngFile(page, 160))
    await expect(page.getByRole('img', { name: 'Avatar atual' })).toBeVisible()
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: 'Avatar atual' })).toHaveAttribute(
      'src',
      /^data:image\/webp;base64,/,
    )
  })

  test('troca de senha confere a atual e vale no próximo login', async ({ page }) => {
    const newPassword = 'Colecao2027'
    await openProfile(page)
    await page.getByLabel('Senha atual').fill('naoeessa1')
    await page.getByLabel('Nova senha', { exact: true }).fill(newPassword)
    await page.getByLabel('Confirmar nova senha').fill(newPassword)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

    await page.getByLabel('Senha atual').fill(ACCOUNTS.colecionador.password)
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()

    await signOut(page)
    await page.goto('/entrar')
    await fillSignIn(page, ACCOUNTS.colecionador)
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await fillSignIn(page, { email: ACCOUNTS.colecionador.email, password: newPassword })
    await expect(page).toHaveURL('/')
  })
})

test('pagamento vem preenchido com os dados da conta', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'no mobile os dados ficam em um acordeão fechado')
  await signIn(page, ACCOUNTS.colecionador, '/pagamento')
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
  await expect(page.getByRole('textbox', { name: 'E-mail', exact: true })).toHaveValue(
    ACCOUNTS.colecionador.email,
  )
})

test.describe('carteiras', () => {
  test('endereço repetido é recusado e a edição válida persiste', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/conta/carteiras')
    await page.getByRole('button', { name: 'Editar carteira secundária' }).click()
    const address = page.getByLabel('Endereço da carteira')
    const original = await address.inputValue()

    await address.fill(PRINCIPAL_ADDRESS)
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Este endereço já é a carteira principal.')).toBeVisible()

    await address.fill(original)
    await page.getByLabel('Apelido da carteira').fill('Cofre frio')
    await page.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

    await page.reload()
    await expect(page.getByText('Cofre frio')).toBeVisible()
  })

  test('"igual à principal" persiste e tira a secundária do pagamento', async ({ page }) => {
    const reserve = page.getByRole('link', { name: 'Gerenciar carteira Reserva' })
    await signIn(page, ACCOUNTS.colecionador, '/pagamento')
    await expect(reserve).toHaveCount(1)

    await page.goto('/conta/carteiras')
    const same = page.getByRole('checkbox', { name: 'Igual à carteira principal' })
    await same.click()
    await expect(page.getByText('A carteira principal também será a secundária.')).toBeVisible()

    await page.reload()
    await expect(same).toBeChecked()
    await expect(page.getByText(/Usando a mesma carteira da principal/)).toBeVisible()

    await page.goto('/pagamento')
    await expect(page.getByRole('link', { name: 'Gerenciar carteira Principal' })).toHaveCount(1)
    await expect(reserve).toHaveCount(0)
  })

  test('conta sem carteira não pode reutilizar a principal', async ({ page }) => {
    await signIn(page, ACCOUNTS.curadora, '/conta/carteiras')
    await expect(page.getByRole('checkbox', { name: 'Igual à carteira principal' })).toBeDisabled()
    await expect(page.getByLabel('Endereço da carteira')).toBeVisible()
  })
})

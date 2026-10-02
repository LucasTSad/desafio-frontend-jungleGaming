import { ACCOUNTS } from '../fixtures/accounts'
import { fillSignIn, signIn, signOut, storedSession } from '../fixtures/auth'
import { expect, test, waitForMocks } from '../fixtures/mock'

const EXPIRED = 'Sua sessão expirou. Entre novamente para continuar.'

test.describe('sessão', () => {
  test('senha errada mostra o erro e não cria sessão', async ({ page }) => {
    await page.goto('/entrar')
    await fillSignIn(page, { email: ACCOUNTS.colecionador.email, password: 'senhaerrada1' })
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL('/entrar')
    expect(await storedSession(page)).toBeNull()
  })

  test('rota privada leva para Entrar e volta ao destino depois do login', async ({ page }) => {
    await page.goto('/conta/perfil')
    await expect(page).toHaveURL('/entrar?redirect=%2Fconta%2Fperfil')
    await fillSignIn(page, ACCOUNTS.colecionador)
    await expect(page).toHaveURL('/conta/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
  })

  test('a sessão sobrevive ao recarregamento', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/conta/perfil')
    await page.reload()
    await expect(page).toHaveURL('/conta/perfil')
    await expect(page.getByLabel('E-mail')).toHaveValue(ACCOUNTS.colecionador.email)
  })

  test('sair encerra a sessão e protege as rotas privadas', async ({ page }) => {
    await signIn(page)
    await signOut(page)
    expect(await storedSession(page)).toBeNull()
    await page.goto('/conta/carteiras')
    await expect(page).toHaveURL('/entrar?redirect=%2Fconta%2Fcarteiras')
  })

  test('cadastro recusa e-mail e usuário já usados', async ({ page }) => {
    await page.goto('/cadastro')
    const form = page.locator('form')
    await form.getByLabel('Nome de usuário').fill('pessoa_nova')
    await form.getByLabel('E-mail').fill(ACCOUNTS.colecionador.email)
    await form.getByLabel('Senha', { exact: true }).fill('Novidade2026')
    await form.getByLabel('Confirmar senha').fill('Novidade2026')
    await form.getByRole('button', { name: /Criar/ }).click()
    await expect(form.getByText('Este e-mail já está cadastrado.')).toBeVisible()

    await form.getByLabel('Nome de usuário').fill('curadora')
    await form.getByLabel('E-mail').fill('pessoa.nova@kurio.dev')
    await form.getByRole('button', { name: /Criar/ }).click()
    await expect(form.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(page).toHaveURL('/cadastro')
  })

  test('cadastro cria a conta, entra e permite login depois', async ({ page }) => {
    const account = { email: 'pessoa.nova@kurio.dev', password: 'Novidade2026' }
    await page.goto('/cadastro?redirect=%2Fconta%2Fperfil')
    const form = page.locator('form')
    await form.getByLabel('Nome de usuário').fill('pessoa_nova')
    await form.getByLabel('E-mail').fill(account.email)
    await form.getByLabel('Senha', { exact: true }).fill(account.password)
    await form.getByLabel('Confirmar senha').fill(account.password)
    await form.getByRole('button', { name: /Criar/ }).click()

    await expect(page).toHaveURL('/conta/perfil')
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('pessoa_nova')

    await signOut(page)
    await signIn(page, account, '/conta/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('pessoa_nova')
  })

  test('trocar de conta não mostra dados da conta anterior', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/conta/carteiras')
    await expect(page.getByText('0xA91F4c2D7e3B5a6C8d9E0f1A2b3C4d5E6f7AE82C')).toBeVisible()
    await signOut(page)

    await signIn(page, ACCOUNTS.curadora, '/conta/carteiras')
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
    await expect(page.getByText('0xA91F4c2D7e3B5a6C8d9E0f1A2b3C4d5E6f7AE82C')).toHaveCount(0)
  })

  test('cenário de sessão expirada pede login e volta ao destino', async ({ page, mock }) => {
    await signIn(page)
    // Requisições ainda em andamento no início venceriam a sessão já nesta página, antes do goto.
    await page.waitForLoadState('networkidle')
    await mock.setScenario('sessao-expirada')
    await page.goto('/conta/perfil')

    await expect(page).toHaveURL('/entrar?redirect=%2Fconta%2Fperfil')
    await expect(page.getByText(EXPIRED)).toBeVisible()
    expect(await storedSession(page)).toBeNull()

    await fillSignIn(page, ACCOUNTS.colecionador)
    await expect(page).toHaveURL('/conta/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
  })

  test('sessão vencida pelo relógio expira durante a navegação', async ({ page, mock }) => {
    await signIn(page, ACCOUNTS.colecionador, '/conta/perfil')
    await expect(page.getByLabel('Nome de exibição')).toHaveValue('Colecionador')
    await mock.advanceClock(31 * 60_000)
    await page
      .getByRole('link', { name: /Carteiras/ })
      .filter({ visible: true })
      .click()

    await expect(page).toHaveURL('/entrar?redirect=%2Fconta%2Fcarteiras')
    await expect(page.getByText(EXPIRED)).toBeVisible()
  })

  test('entrar e sair em uma aba vale para as outras', async ({ page, context }) => {
    const other = await context.newPage()
    await other.goto('/conta/perfil')
    await waitForMocks(other)
    await expect(other).toHaveURL('/entrar?redirect=%2Fconta%2Fperfil')

    await signIn(page)
    await expect(other).toHaveURL('/conta/perfil')
    await expect(other.getByLabel('Nome de exibição')).toHaveValue('Colecionador')

    await signOut(page)
    await expect(other).toHaveURL('/entrar?redirect=%2Fconta%2Fperfil')
  })
})

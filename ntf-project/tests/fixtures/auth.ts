import { expect, type Page } from '@playwright/test'
import { ACCOUNTS } from './accounts'

type Credentials = { email: string; password: string }

export async function fillSignIn(page: Page, { email, password }: Credentials) {
  const form = page.locator('form', { has: page.getByLabel('Senha', { exact: true }) })
  await form.getByLabel('E-mail').fill(email)
  await form.getByLabel('Senha', { exact: true }).fill(password)
  await form.getByRole('button', { name: 'Entrar' }).click()
}

/** Entra pela tela /entrar e espera chegar ao destino (o início, quando não houver outro). */
export async function signIn(
  page: Page,
  account: Credentials = ACCOUNTS.colecionador,
  redirect?: string,
) {
  await page.goto(redirect ? `/entrar?redirect=${encodeURIComponent(redirect)}` : '/entrar')
  await fillSignIn(page, account)
  await expect(page).toHaveURL(redirect ?? '/')
}

export async function signOut(page: Page) {
  await page.goto('/conta/perfil')
  await page.getByRole('button', { name: 'Sair' }).filter({ visible: true }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
}

export function storedSession(page: Page) {
  return page.evaluate(() => localStorage.getItem('kurio-session'))
}

import type { Page, TestInfo } from '@playwright/test'

export const cards = (page: Page) => page.locator('#mercado article')
export const cardTitles = (page: Page) => cards(page).locator('h3')
export const resultCount = (page: Page) => page.locator('#mercado [aria-live="polite"]')

export const isMobile = (testInfo: TestInfo) => testInfo.project.name === 'mobile'

export const searchParams = (page: Page) => new URL(page.url()).searchParams

/** Busca pelo campo da tela: no desktop ele fica atrás do botão do cabeçalho. */
export async function searchFor(page: Page, term: string, mobile: boolean) {
  if (!mobile) await page.getByRole('button', { name: 'Abrir busca' }).click()
  const box = page.getByRole('searchbox', { name: 'Buscar NFTs' }).filter({ visible: true })
  await box.fill(term)
  await box.press('Enter')
}

/** Painel de filtros: a barra lateral no desktop, o drawer aberto pelo botão no mobile. */
export async function openFilters(page: Page, mobile: boolean) {
  if (!mobile) return page.getByRole('complementary', { name: 'Filtros do catálogo' })
  await page
    .getByRole('button', { name: /^Filtros/ })
    .filter({ visible: true })
    .click()
  return page.getByRole('dialog', { name: 'Filtros' })
}

export async function sortBy(page: Page, label: string) {
  await page.getByRole('combobox', { name: 'Ordenar por:' }).filter({ visible: true }).click()
  await page.getByRole('option', { name: label }).click()
}

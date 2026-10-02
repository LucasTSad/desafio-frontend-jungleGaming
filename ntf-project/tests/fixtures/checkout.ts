import { expect, type Page } from '@playwright/test'

export const visible = (page: Page, name: string | RegExp) =>
  page.getByRole('button', { name }).filter({ visible: true })
export const review = (page: Page) => page.getByRole('dialog', { name: 'Revisar compra' })
export const payButton = (page: Page) =>
  review(page).getByRole('button', { name: /^Confirmar e pagar/ })
export const confirmedHeading = (page: Page) =>
  page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })

/** Preenche o que falta no formulário (o resto vem do perfil) e abre a revisão. */
export async function openReview(page: Page) {
  await expect(visible(page, 'Confirmar compra')).toBeVisible()
  const collector = page.getByRole('button', { name: 'Dados do colecionador' })
  if (await collector.isVisible()) await collector.click()
  await page.getByLabel('Nome do perfil').fill('Coleção principal')
  await page.getByLabel('Código de indicação').fill('KURIO-2026')
  await visible(page, 'Confirmar compra').click()
  await expect(review(page)).toBeVisible()
}

export async function placeOrder(page: Page) {
  await payButton(page).click()
  await expect(page).toHaveURL(/\/pedidos\/ord_\d+$/)
  return page.url().split('/').pop()!
}

import type { Page } from '@playwright/test'
import { ACCOUNTS } from '../fixtures/accounts'
import { signIn } from '../fixtures/auth'
import { expect, test } from '../fixtures/mock'

/** Coração do card no catálogo, seja qual for o estado ("Adicionar … aos" / "Remover … dos"). */
const heart = (page: Page, name: string) =>
  page.locator('#mercado').getByRole('button', { name: new RegExp(`${name} (aos|dos) favoritos$`) })

test.describe('favoritos', () => {
  test('visitante é convidado a entrar ao favoritar', async ({ page }) => {
    await page.goto('/')
    await heart(page, 'Emerald Ape #042').click()
    await expect(page.getByText('Entre na sua conta para salvar favoritos.')).toBeVisible()
    await expect(heart(page, 'Emerald Ape #042')).toHaveAttribute('aria-pressed', 'false')
  })

  test('favoritar muda na hora, persiste e aparece na lista de interesse', async ({
    page,
    mock,
  }) => {
    await signIn(page)
    await expect(heart(page, 'Emerald Ape #042')).toHaveAttribute('aria-pressed', 'true')

    const sage = heart(page, 'Sage Nomad #009')
    await expect(sage).toHaveAttribute('aria-pressed', 'false')
    // Com a rede lenta (1,5 s ou mais), o coração só muda antes da resposta se for otimista.
    await mock.setScenario('lento')
    await sage.click()
    await expect(sage).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 })
    // O anúncio só sai depois que a API confirma; recarregar antes disso perderia o clique.
    await expect(page.getByText('Sage Nomad #009 adicionado aos favoritos')).toBeAttached()

    await mock.setScenario('padrao')
    await page.reload()
    await expect(heart(page, 'Sage Nomad #009')).toHaveAttribute('aria-pressed', 'true')

    await page.goto('/conta/favoritos')
    await expect(page.locator('main article h2, main article h3').first()).toHaveText(
      'Sage Nomad #009',
    )
  })

  test('falha na API desfaz o favorito e avisa', async ({ page, mock }) => {
    await signIn(page)
    const sage = heart(page, 'Sage Nomad #009')
    // Favoritos já carregados: a falha precisa vir da mutation, não da leitura da lista.
    await expect(heart(page, 'Emerald Ape #042')).toHaveAttribute('aria-pressed', 'true')
    await expect(sage).toHaveAttribute('aria-pressed', 'false')

    await mock.setScenario('erro-servidor')
    await sage.click()
    await expect(
      page.getByText('Não foi possível favoritar Sage Nomad #009.').first(),
    ).toBeVisible()
    await expect(sage).toHaveAttribute('aria-pressed', 'false')
  })

  test('desfavoritar na lista mantém o card até sair da página', async ({ page }) => {
    await signIn(page, ACCOUNTS.colecionador, '/conta/favoritos')
    const remove = page.getByRole('button', { name: 'Remover Golden Beat #207 dos favoritos' })
    await remove.click()
    await expect(
      page.getByRole('button', { name: 'Adicionar Golden Beat #207 aos favoritos' }),
    ).toBeVisible()

    await page.reload()
    await expect(page.getByText('Golden Beat #207')).toHaveCount(0)
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  })

  test('outra conta não herda os favoritos', async ({ page }) => {
    await signIn(page, ACCOUNTS.curadora, '/conta/favoritos')
    await expect(page.getByText('Sua lista de interesse está vazia')).toBeVisible()
  })
})

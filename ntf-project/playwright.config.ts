import { join } from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

/**
 * Testes de unidade (sem navegador) e E2E contra o build de demonstração com os mocks ligados.
 * O servidor de preview é o mesmo usado na auditoria, para testar exatamente o que é publicado.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Cada teste E2E restaura os mocks e espera o service worker; com muitos navegadores em
  // paralelo numa máquina ocupada, essa preparação sozinha passa de 20 s.
  workers: 4,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    // Regressão visual: baselines em pixels CSS (o mobile não fica 2,6x maior), sem animações nem cursor.
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
      stylePath: join(import.meta.dirname, 'tests/fixtures/screenshot.css'),
    },
  },
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },
  projects: [
    { name: 'unit', testDir: './tests/unit' },
    {
      name: 'desktop',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testDir: './tests/e2e',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

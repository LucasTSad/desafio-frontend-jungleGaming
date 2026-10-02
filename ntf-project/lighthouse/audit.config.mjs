/** O que a auditoria mede (§10 do desafio): páginas, perfis, número de medições e metas. */

export const PORT = 4174
export const RUNS = 3

export const PAGES = [
  { id: 'inicio', name: 'Início', path: '/' },
  { id: 'detalhe', name: 'Detalhe do NFT', path: '/nft/emerald-ape-042' },
]

export const PROFILES = [
  { id: 'mobile', name: 'Mobile', config: 'lighthouse/mobile.config.mjs' },
  { id: 'desktop', name: 'Desktop', config: 'lighthouse/desktop.config.mjs' },
]

export const CATEGORIES = [
  { id: 'performance', name: 'Performance', target: 90 },
  { id: 'accessibility', name: 'Accessibility', target: 95 },
  { id: 'best-practices', name: 'Best Practices', target: 95 },
  { id: 'seo', name: 'SEO', target: 90 },
]

/** LCP, CLS e TBT são exigidos; FCP e Speed Index entram para explicar a nota de performance. */
export const METRICS = [
  { id: 'largest-contentful-paint', name: 'LCP', unit: 'ms' },
  { id: 'cumulative-layout-shift', name: 'CLS' },
  { id: 'total-blocking-time', name: 'TBT', unit: 'ms' },
  { id: 'first-contentful-paint', name: 'FCP', unit: 'ms' },
  { id: 'speed-index', name: 'Speed Index', unit: 'ms' },
]

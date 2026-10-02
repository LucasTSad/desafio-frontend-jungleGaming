import { CATEGORIES } from './audit.config.mjs'

/**
 * Perfil mobile padrão do Lighthouse: Moto G Power emulado (412 × 823, DPR 1,75), 4G lento simulado
 * (RTT 150 ms, 1,6 Mbps) e CPU 4x mais lenta. Só as categorias pedidas no desafio.
 */
export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: CATEGORIES.map((category) => category.id),
  },
}

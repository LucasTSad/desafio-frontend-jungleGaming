import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import { CATEGORIES } from './audit.config.mjs'

/**
 * Perfil desktop padrão do Lighthouse (o mesmo de `--preset=desktop`): 1350 × 940, DPR 1, rede
 * simulada com RTT 40 ms e 10 Mbps e CPU sem desaceleração. Só as categorias pedidas no desafio.
 */
export default {
  ...desktopConfig,
  settings: {
    ...desktopConfig.settings,
    onlyCategories: CATEGORIES.map((category) => category.id),
  },
}

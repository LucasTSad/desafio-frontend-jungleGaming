import { updateNft, type NftChange } from './catalog'
import { DB_STORAGE_KEY, db, mockClock } from './db/store'
import {
  getScenario,
  isScenarioId,
  SCENARIO_STORAGE_KEY,
  SCENARIOS,
  setScenario,
  type ScenarioId,
} from './scenarios'

/** Dados do app guardados no navegador (sessão, carrinho do visitante etc.) usam este prefixo. */
const APP_STORAGE_PREFIX = 'kurio-'
const MOCK_KEYS = new Set([DB_STORAGE_KEY, SCENARIO_STORAGE_KEY])

function clearAppStorage() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (const key of Object.keys(storage)) {
        if (key.startsWith(APP_STORAGE_PREFIX) && !MOCK_KEYS.has(key)) storage.removeItem(key)
      }
    } catch {
      // Storage indisponível: não há o que limpar.
    }
  }
}

export type MockControl = {
  scenarios: typeof SCENARIOS
  getScenario: () => ScenarioId
  setScenario: (id: ScenarioId) => void
  /** Volta às fixtures, limpa os dados do app no navegador e aplica o cenário (padrão: "padrao"). */
  reset: (options?: { scenario?: ScenarioId; seed?: number }) => void
  /** Avança o relógio do mock (ex.: expirar sessão ou cotação). */
  advanceClock: (ms: number) => void
  now: () => number
  /** Muda preço e/ou estoque de um NFT, como faria o backend real (ex.: outra venda). */
  updateNft: (id: string, change: NftChange) => void
}

export const mockControl: MockControl = {
  scenarios: SCENARIOS,
  getScenario,
  setScenario: (id) => {
    if (!isScenarioId(id)) throw new Error(`Cenário desconhecido: ${String(id)}`)
    setScenario(id)
  },
  reset: ({ scenario = 'padrao', seed } = {}) => {
    db.reset(seed)
    clearAppStorage()
    setScenario(scenario)
  },
  advanceClock: (ms) => mockClock.advance(ms),
  now: () => mockClock.now(),
  updateNft: (id, change) => {
    updateNft(id, change)
  },
}

declare global {
  interface Window {
    __kurioMock?: MockControl
  }
}

export function installMockControl() {
  window.__kurioMock = mockControl
}

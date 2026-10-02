import { DEFAULT_SEED, mockClock } from './db/store'

type NetworkProfile = {
  /** Faixa de latência em ms; o valor exato sai de um gerador com semente fixa. */
  latency: [min: number, max: number]
  /** offline: falha de conexão; error: 503 em todas as chamadas; flaky: falha as 3 primeiras tentativas de cada requisição. */
  failure?: 'offline' | 'error' | 'flaky'
}

type ScenarioDefinition = {
  label: string
  description: string
  network: NetworkProfile
}

const NORMAL: NetworkProfile = { latency: [120, 400] }

export const SCENARIOS = {
  padrao: {
    label: 'Padrão',
    description: 'Tudo funcionando, com latência curta e variável.',
    network: NORMAL,
  },
  vazio: {
    label: 'Catálogo vazio',
    description: 'A busca e as listas não retornam resultados.',
    network: NORMAL,
  },
  lento: {
    label: 'Rede lenta',
    description: 'Respostas entre 1,5 s e 3 s para avaliar os skeletons.',
    network: { latency: [1500, 3000] },
  },
  'fora-de-ordem': {
    label: 'Respostas fora de ordem',
    description: 'Latência muito variável: respostas antigas podem chegar depois das novas.',
    network: { latency: [50, 2500] },
  },
  offline: {
    label: 'Sem conexão',
    description: 'Todas as chamadas falham por falta de conexão.',
    network: { latency: [100, 300], failure: 'offline' },
  },
  'erro-servidor': {
    label: 'Erro no servidor',
    description: 'Todas as chamadas respondem 503.',
    network: { latency: [100, 300], failure: 'error' },
  },
  instavel: {
    label: 'Instável',
    description: 'Cada requisição falha nas 3 primeiras tentativas e funciona ao tentar de novo.',
    network: { latency: [100, 300], failure: 'flaky' },
  },
  'sessao-expirada': {
    label: 'Sessão expirada',
    description: 'A próxima chamada autenticada responde que a sessão expirou.',
    network: NORMAL,
  },
  'cupom-expirado': {
    label: 'Cupom expirado',
    description: 'Qualquer cupom aplicado é recusado como vencido.',
    network: NORMAL,
  },
  'preco-alterado': {
    label: 'Preço alterado',
    description: 'O preço de um item do carrinho muda durante o checkout.',
    network: NORMAL,
  },
  'edicao-esgotada': {
    label: 'Edição esgotada',
    description: 'Uma edição do carrinho esgota durante o checkout.',
    network: NORMAL,
  },
  'carteira-recusada': {
    label: 'Carteira recusa a conexão',
    description: 'A primeira conexão com a carteira é recusada.',
    network: NORMAL,
  },
  'timeout-pedido': {
    label: 'Timeout no pedido',
    description: 'O pedido é criado, mas a resposta se perde; o reenvio recupera o mesmo pedido.',
    network: NORMAL,
  },
  'pagamento-recusado': {
    label: 'Pagamento recusado',
    description: 'O pedido é criado e a rede recusa o pagamento.',
    network: NORMAL,
  },
  'eventos-duplicados': {
    label: 'Eventos duplicados',
    description: 'Eventos em tempo real chegam repetidos e fora de ordem.',
    network: NORMAL,
  },
} satisfies Record<string, ScenarioDefinition>

export type ScenarioId = keyof typeof SCENARIOS

export const SCENARIO_STORAGE_KEY = 'kurio-mock-scenario'
export const SCENARIO_QUERY_PARAM = 'cenario'

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && value in SCENARIOS
}

type ScenarioState = { id: ScenarioId; activatedAt: number }

function store(state: ScenarioState) {
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Sem storage, o cenário vale só até recarregar a página.
  }
}

function readInitialScenario(): ScenarioState {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get(SCENARIO_QUERY_PARAM)
    if (isScenarioId(fromUrl)) {
      const state = { id: fromUrl, activatedAt: mockClock.now() }
      store(state)
      return state
    }
    const stored = JSON.parse(localStorage.getItem(SCENARIO_STORAGE_KEY) ?? 'null') as unknown
    if (stored && typeof stored === 'object' && 'id' in stored && isScenarioId(stored.id)) {
      return stored as ScenarioState
    }
  } catch {
    // Valor antigo ou inválido: volta ao padrão.
  }
  return { id: 'padrao', activatedAt: 0 }
}

let current: ScenarioState = readInitialScenario()

export function getScenario(): ScenarioId {
  return current.id
}

export function isScenario(id: ScenarioId) {
  return current.id === id
}

/** Momento (no relógio do mock) em que o cenário atual foi ativado. */
export function getScenarioActivatedAt() {
  return current.activatedAt
}

export function setScenario(id: ScenarioId) {
  current = { id, activatedAt: mockClock.now() }
  resetRandom()
  failures.clear()
  store(current)
}

/** Gerador mulberry32: a mesma semente produz a mesma sequência de latências. */
function createRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let random = createRandom(DEFAULT_SEED)

export function resetRandom(seed = DEFAULT_SEED) {
  random = createRandom(seed)
}

export function currentNetwork(): NetworkProfile {
  return SCENARIOS[current.id].network
}

export function nextLatency(): number {
  const [min, max] = currentNetwork().latency
  return Math.round(min + random() * (max - min))
}

/** Tentativas já falhadas por requisição no cenário "instavel". */
const failures = new Map<string, number>()
export const FLAKY_FAILURES = 3

export function shouldFailFlaky(requestKey: string) {
  const count = failures.get(requestKey) ?? 0
  if (count >= FLAKY_FAILURES) return false
  failures.set(requestKey, count + 1)
  return true
}

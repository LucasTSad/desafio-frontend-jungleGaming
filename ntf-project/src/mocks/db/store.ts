import { NFT_FIXTURES } from '../fixtures/nfts'
import { USER_FIXTURES } from '../fixtures/users'
import type { CartRecord, DbState } from './types'

/** Mudar a estrutura do banco exige subir a versão: dados antigos são descartados no carregamento. */
const SCHEMA_VERSION = 2
export const DB_STORAGE_KEY = 'kurio-mock-db'
export const DEFAULT_SEED = 20261002

export function createSeedState(seed = DEFAULT_SEED): DbState {
  const carts: Record<string, CartRecord> = {}
  for (const user of USER_FIXTURES) {
    if (user.cart.length === 0) continue
    const id = `cart_${user.id}`
    carts[id] = {
      id,
      userId: user.id,
      version: 1,
      couponCode: null,
      lines: user.cart.map((line) => ({
        ...line,
        id: `${line.nftId}:${line.editionId}`,
        seenPriceEth: NFT_FIXTURES.find((nft) => nft.id === line.nftId)?.priceEth ?? '0',
      })),
    }
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    seed,
    clockOffsetMs: 0,
    nfts: Object.fromEntries(
      NFT_FIXTURES.map((nft) => [
        nft.id,
        {
          priceEth: nft.priceEth,
          previousPriceEth: nft.previousPriceEth,
          editions: { ...nft.editions },
          version: 1,
        },
      ]),
    ),
    users: Object.fromEntries(
      USER_FIXTURES.map((user) => [
        user.id,
        {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          passwordSalt: user.passwordSalt,
          passwordHash: user.passwordHash,
          avatarUrl: null,
          ensName: user.ensName,
          walletNickname: user.walletNickname,
          profileVersion: 1,
          wallets: structuredClone(user.wallets),
        },
      ]),
    ),
    sessions: {},
    favorites: Object.fromEntries(USER_FIXTURES.map((user) => [user.id, [...user.favorites]])),
    carts,
    quotes: {},
    walletConnections: {},
    orders: {},
    idempotency: {},
    sequence: 0,
  }
}

function readStored(): DbState | null {
  try {
    const raw = localStorage.getItem(DB_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DbState
    return parsed.schemaVersion === SCHEMA_VERSION ? parsed : null
  } catch {
    return null
  }
}

let state: DbState = readStored() ?? createSeedState()
const listeners = new Set<(state: DbState) => void>()

// Cada aba roda o próprio mock; ao gravar, as outras abas recarregam o estado para enxergar a mesma
// "base de dados" (ex.: sessão criada em uma aba vale nas demais).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== DB_STORAGE_KEY) return
    const next = readStored()
    if (!next) return
    state = next
    for (const listener of listeners) listener(state)
  })
}

function persist() {
  try {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Sem storage disponível, o mock segue em memória até o próximo carregamento.
  }
}

export const db = {
  /** Leitura do estado atual. Não altere o objeto retornado: use `db.update`. */
  get(): Readonly<DbState> {
    return state
  },

  /** Toda escrita passa por aqui: persiste e avisa quem acompanha mudanças (ex.: eventos). */
  update<T>(change: (draft: DbState) => T): T {
    const draft = structuredClone(state)
    const result = change(draft)
    state = draft
    persist()
    for (const listener of listeners) listener(state)
    return result
  },

  /** Restaura integralmente o estado conhecido das fixtures. */
  reset(seed = DEFAULT_SEED) {
    state = createSeedState(seed)
    persist()
    for (const listener of listeners) listener(state)
  },

  subscribe(listener: (state: DbState) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Gera ids determinísticos (ex.: "ord_000012") para que cenários e testes sejam reproduzíveis. */
  nextId(prefix: string) {
    return db.update((draft) => {
      draft.sequence += 1
      return `${prefix}_${String(draft.sequence).padStart(6, '0')}`
    })
  },
}

/** Relógio do mock: o tempo real deslocado por `clockOffsetMs`, para simular expirações. */
export const mockClock = {
  now() {
    return Date.now() + state.clockOffsetMs
  },
  iso(offsetMs = 0) {
    return new Date(mockClock.now() + offsetMs).toISOString()
  },
  advance(ms: number) {
    db.update((draft) => {
      draft.clockOffsetMs += ms
    })
  },
}

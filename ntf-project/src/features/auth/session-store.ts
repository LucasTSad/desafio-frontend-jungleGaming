import type { Session } from '@/api/contracts/auth'

export const SESSION_STORAGE_KEY = 'kurio-session'

/** Por que o token mudou: quem escuta decide o que limpar, avisar e reavaliar. */
export type SessionChange =
  | { reason: 'signed-in' | 'signed-out' | 'expired'; external: false }
  | { reason: 'changed'; external: true }

type Listener = (change: SessionChange) => void

let current: Session | null = read()
const listeners = new Set<Listener>()

function read(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function write(session: Session | null) {
  current = session
  try {
    if (session) localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch {
    // Sem storage disponível, a sessão vale só nesta aba até o próximo carregamento.
  }
}

function emit(change: SessionChange) {
  for (const listener of listeners) listener(change)
}

// Entrar ou sair em outra aba chega aqui pelo evento "storage" e vale para esta também.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== SESSION_STORAGE_KEY && event.key !== null) return
    const next = read()
    if (next?.token === current?.token) return
    current = next
    emit({ reason: 'changed', external: true })
  })
}

export const sessionStore = {
  getToken() {
    return current?.token ?? null
  },

  signIn(session: Session) {
    write(session)
    emit({ reason: 'signed-in', external: false })
  },

  /** Encerra a sessão local. Sem token não há o que encerrar, então nada é emitido. */
  end(reason: 'signed-out' | 'expired') {
    if (!current) return
    write(null)
    emit({ reason, external: false })
  },

  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

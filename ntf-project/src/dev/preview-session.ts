// Sessão de exemplo, temporária até a integração com a API (MSW).
// Não valida senha: a conferência real (com hash) fica para a etapa da API.
// Contas e sessão ficam no sessionStorage só para a demonstração sobreviver a um refresh.

import { useSyncExternalStore } from 'react'
import type { HeaderUser } from '@/components/layout/site-header'
import type { SignInValues, SignUpValues } from '@/features/auth/schemas'
import type { AuthSubmitResult } from '@/features/auth/types'

export type PreviewAccount = {
  username: string
  email: string
  displayName: string
  avatarUrl?: string
}

type State = { accounts: PreviewAccount[]; currentEmail: string | null }

const STORAGE_KEY = 'kurio-preview-session'
const DEFAULT_STATE: State = {
  accounts: [
    { username: 'colecionador', email: 'colecionador@kurio.dev', displayName: 'Colecionador' },
  ],
  currentEmail: null,
}

let state: State = readState()
let user: HeaderUser | null = toUser(state)
const listeners = new Set<() => void>()

function readState(): State {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as State) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

function toUser({ accounts, currentEmail }: State): HeaderUser | null {
  const account = accounts.find((item) => item.email === currentEmail)
  return account ? { displayName: account.displayName, avatarUrl: account.avatarUrl } : null
}

function setState(next: State) {
  state = next
  user = toUser(next)
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Sem storage disponível, a sessão continua só em memória.
  }
  for (const listener of listeners) listener()
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const latency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function usePreviewUser() {
  return useSyncExternalStore(subscribeSession, () => user)
}

export function getCurrentAccount() {
  return state.accounts.find((item) => item.email === state.currentEmail)
}

/** Verifica conflitos de cadastro ignorando a própria conta. */
export function findConflict(username: string, email: string, ownEmail?: string) {
  const others = state.accounts.filter((item) => item.email !== ownEmail)
  if (others.some((item) => item.email === email.toLowerCase())) return 'email' as const
  if (others.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
    return 'username' as const
  }
  return undefined
}

export function updateCurrentAccount(patch: Partial<PreviewAccount>) {
  const current = getCurrentAccount()
  if (!current) return
  const updated = { ...current, ...patch }
  setState({
    accounts: state.accounts.map((item) => (item === current ? updated : item)),
    currentEmail: updated.email,
  })
}

export const previewAuth = {
  async signIn({ email }: SignInValues): Promise<AuthSubmitResult<keyof SignInValues>> {
    await latency(700)
    const account = state.accounts.find((item) => item.email === email)
    if (!account) {
      return { ok: false, message: 'E-mail ou senha incorretos. Confira e tente novamente.' }
    }
    setState({ ...state, currentEmail: account.email })
    return { ok: true, displayName: account.displayName }
  },

  async signUp({ username, email }: SignUpValues): Promise<AuthSubmitResult<keyof SignUpValues>> {
    await latency(900)
    const conflict = findConflict(username, email)
    if (conflict === 'email') {
      return {
        ok: false,
        field: 'email',
        message: 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.',
      }
    }
    if (conflict === 'username') {
      return { ok: false, field: 'username', message: 'Este nome de usuário já está em uso.' }
    }
    setState({
      accounts: [...state.accounts, { username, email, displayName: username }],
      currentEmail: email,
    })
    return { ok: true, displayName: username }
  },

  signOut() {
    setState({ ...state, currentEmail: null })
  },
}

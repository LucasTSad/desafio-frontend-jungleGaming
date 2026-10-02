// Sessão de exemplo em memória, temporária até a integração com a API (MSW).
// Não valida senha: a conferência real (com hash) fica para a etapa da API.

import { useSyncExternalStore } from 'react'
import type { HeaderUser } from '@/components/layout/site-header'
import type { SignInValues, SignUpValues } from '@/features/auth/schemas'
import type { AuthSubmitResult } from '@/features/auth/types'

type PreviewAccount = { username: string; email: string; displayName: string }

let accounts: PreviewAccount[] = [
  { username: 'colecionador', email: 'colecionador@kurio.dev', displayName: 'Colecionador' },
]
let currentUser: HeaderUser | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setUser(user: HeaderUser | null) {
  currentUser = user
  for (const listener of listeners) listener()
}

const latency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function usePreviewUser() {
  return useSyncExternalStore(subscribe, () => currentUser)
}

export const previewAuth = {
  async signIn({ email }: SignInValues): Promise<AuthSubmitResult<keyof SignInValues>> {
    await latency(700)
    const account = accounts.find((item) => item.email === email)
    if (!account) {
      return { ok: false, message: 'E-mail ou senha incorretos. Confira e tente novamente.' }
    }
    setUser({ displayName: account.displayName })
    return { ok: true, displayName: account.displayName }
  },

  async signUp({ username, email }: SignUpValues): Promise<AuthSubmitResult<keyof SignUpValues>> {
    await latency(900)
    if (accounts.some((item) => item.email === email)) {
      return {
        ok: false,
        field: 'email',
        message: 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.',
      }
    }
    if (accounts.some((item) => item.username.toLowerCase() === username.toLowerCase())) {
      return { ok: false, field: 'username', message: 'Este nome de usuário já está em uso.' }
    }
    accounts = [...accounts, { username, email, displayName: username }]
    setUser({ displayName: username })
    return { ok: true, displayName: username }
  },

  signOut() {
    setUser(null)
  },
}

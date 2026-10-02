import type { AuthMode } from './types'

export function welcomeMessage(mode: AuthMode, displayName: string) {
  return mode === 'sign-in'
    ? `Olá, ${displayName}! Você entrou na sua conta.`
    : `Conta criada! Boas-vindas à Kurio, ${displayName}.`
}

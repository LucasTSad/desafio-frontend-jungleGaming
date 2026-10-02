// Perfil e carteiras de exemplo, temporários até a integração com a API (MSW).
// Os dados ficam no sessionStorage, por e-mail da conta, só para a demonstração sobreviver a um refresh.

import { useSyncExternalStore } from 'react'
import type { ProfileValues, WalletValues } from '@/features/account/schemas'
import type {
  AccountProfile,
  AccountWallets,
  SaveResult,
  WalletRecord,
  WalletSlot,
} from '@/features/account/types'
import { shortenHex } from '@/features/checkout/format'
import type { SavedWallet } from '@/features/checkout/types'
import {
  findConflict,
  getCurrentAccount,
  subscribeSession,
  updateCurrentAccount,
  type PreviewAccount,
} from './preview-session'

type AccountExtras = { ensName: string; walletNickname: string; wallets: AccountWallets }

export type PreviewAccountSnapshot = {
  profile: AccountProfile
  wallets: AccountWallets
  savedWallets: SavedWallet[]
}

const STORAGE_KEY = 'kurio-preview-account'
const EMPTY_EXTRAS: AccountExtras = { ensName: '', walletNickname: '', wallets: {} }
const EMPTY_WALLETS: SavedWallet[] = []

const DEMO_PRINCIPAL: WalletRecord = {
  nickname: 'Principal',
  displayName: 'Colecionador',
  profileName: 'Colecionador Kurio',
  network: 'ethereum',
  address: '0xA91F4c2D7e3B5a6C8d9E0f1A2b3C4d5E6f7AE82C',
  secondaryWallet: '',
  walletType: 'metamask',
  referralCode: 'KURIO-2026',
  email: 'colecionador@kurio.dev',
  ensName: 'colecionador',
}

const DEFAULT_EXTRAS: Record<string, AccountExtras> = {
  'colecionador@kurio.dev': {
    ensName: 'colecionador',
    walletNickname: 'Principal',
    wallets: {
      principal: DEMO_PRINCIPAL,
      secundaria: {
        ...DEMO_PRINCIPAL,
        nickname: 'Reserva',
        network: 'polygon',
        address: '0x5c3B9d27E4a1F0c86D2e7B41a9F3c0D58e6A2b17',
        walletType: 'coinbase',
        ensName: 'nova',
      },
    },
  },
}

let extrasByEmail: Record<string, AccountExtras> = readStored()
const listeners = new Set<() => void>()
const latency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function readStored(): Record<string, AccountExtras> {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Record<string, AccountExtras>) : DEFAULT_EXTRAS
  } catch {
    return DEFAULT_EXTRAS
  }
}

function setExtras(email: string, extras: AccountExtras, previousEmail = email) {
  const { [previousEmail]: _previous, ...others } = extrasByEmail
  extrasByEmail = { ...others, [email]: extras }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(extrasByEmail))
  } catch {
    // Sem storage disponível, os dados continuam só em memória.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  const unsubscribeSession = subscribeSession(listener)
  listeners.add(listener)
  return () => {
    unsubscribeSession()
    listeners.delete(listener)
  }
}

function toSavedWallet(slot: WalletSlot, wallet: WalletRecord): SavedWallet {
  return {
    id: slot,
    label: wallet.nickname,
    displayAddress: shortenHex(wallet.address),
    address: wallet.address,
    network: wallet.network,
    provider: wallet.walletType,
  }
}

// O snapshot só é recriado quando a conta ou os dados dela mudam, como o useSyncExternalStore exige.
let cache: { account?: PreviewAccount; extras?: AccountExtras; snapshot?: PreviewAccountSnapshot } =
  {}

function getSnapshot() {
  const account = getCurrentAccount()
  const extras = account ? (extrasByEmail[account.email] ?? EMPTY_EXTRAS) : undefined
  if (account === cache.account && extras === cache.extras) return cache.snapshot

  let snapshot: PreviewAccountSnapshot | undefined
  if (account && extras) {
    const { principal, secundaria, secondaryIsPrincipal } = extras.wallets
    snapshot = {
      profile: {
        displayName: account.displayName,
        username: account.username,
        email: account.email,
        avatarUrl: account.avatarUrl,
        ensName: extras.ensName,
        walletNickname: extras.walletNickname,
      },
      wallets: extras.wallets,
      savedWallets: [
        ...(principal ? [toSavedWallet('principal', principal)] : []),
        ...(secundaria && !secondaryIsPrincipal ? [toSavedWallet('secundaria', secundaria)] : []),
      ],
    }
  }
  cache = { account, extras, snapshot }
  return snapshot
}

export function usePreviewAccount() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

export function usePreviewSavedWallets() {
  return usePreviewAccount()?.savedWallets ?? EMPTY_WALLETS
}

const SIGNED_OUT: SaveResult<never> = {
  ok: false,
  message: 'Sua sessão terminou. Entre novamente para salvar as alterações.',
}

function currentExtras() {
  const account = getCurrentAccount()
  return account ? { account, extras: extrasByEmail[account.email] ?? EMPTY_EXTRAS } : undefined
}

export const previewAccount = {
  async saveProfile(
    values: ProfileValues,
    avatarUrl: string | undefined,
  ): Promise<SaveResult<keyof ProfileValues>> {
    await latency(900)
    const current = currentExtras()
    if (!current) return SIGNED_OUT

    const email = values.email.toLowerCase()
    const conflict = findConflict(values.username, email, current.account.email)
    if (conflict === 'email') {
      return { ok: false, field: 'email', message: 'Este e-mail já pertence a outra conta.' }
    }
    if (conflict === 'username') {
      return { ok: false, field: 'username', message: 'Este nome de usuário já está em uso.' }
    }

    setExtras(
      email,
      { ...current.extras, ensName: values.ensName, walletNickname: values.walletNickname },
      current.account.email,
    )
    updateCurrentAccount({
      displayName: values.displayName,
      username: values.username,
      email,
      avatarUrl,
    })
    return { ok: true }
  },

  async saveWallet(
    slot: WalletSlot,
    values: WalletValues,
  ): Promise<SaveResult<keyof WalletValues>> {
    await latency(800)
    const current = currentExtras()
    if (!current) return SIGNED_OUT

    const { principal, secundaria } = current.extras.wallets
    const other = slot === 'principal' ? secundaria : principal
    if (other && other.address.toLowerCase() === values.address.toLowerCase()) {
      return {
        ok: false,
        field: 'address',
        message:
          slot === 'principal'
            ? 'Este endereço já está cadastrado como carteira secundária.'
            : 'Este endereço já é a carteira principal. Marque "Igual à carteira principal" para reutilizá-la.',
      }
    }

    setExtras(current.account.email, {
      ...current.extras,
      wallets: { ...current.extras.wallets, [slot]: values },
    })
    return { ok: true }
  },

  async setSecondarySameAsPrincipal(same: boolean): Promise<SaveResult> {
    await latency(500)
    const current = currentExtras()
    if (!current) return SIGNED_OUT
    if (same && !current.extras.wallets.principal) {
      return { ok: false, message: 'Cadastre a carteira principal antes de reutilizá-la.' }
    }

    setExtras(current.account.email, {
      ...current.extras,
      wallets: { ...current.extras.wallets, secondaryIsPrincipal: same },
    })
    return { ok: true }
  },
}

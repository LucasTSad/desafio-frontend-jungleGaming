import type { CheckoutNetwork, WalletProvider } from '@/features/checkout/types'

export type WalletSlot = 'principal' | 'secundaria'

export type AccountProfile = {
  displayName: string
  username: string
  email: string
  /** Parte do nome ENS antes de ".eth". */
  ensName: string
  walletNickname: string
  avatarUrl?: string
}

export type WalletRecord = {
  nickname: string
  displayName: string
  profileName: string
  network: CheckoutNetwork
  address: string
  secondaryWallet: string
  walletType: WalletProvider
  referralCode: string
  email: string
  ensName: string
}

export type AccountWallets = {
  principal?: WalletRecord
  secundaria?: WalletRecord
  /** A principal também faz o papel de secundária; a secundária cadastrada fica guardada. */
  secondaryIsPrincipal?: boolean
}

/** Resultado de um envio: em caso de falha, `field` indica o campo que recebe a mensagem. */
export type SaveResult<TField extends string = string> =
  { ok: true } | { ok: false; message: string; field?: TField }

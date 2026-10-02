import type { ProfileDto, WalletRecordDto, WalletsDto } from '@/api/contracts/account'
import { shortenHex } from '@/features/checkout/format'
import type { SavedWallet } from '@/features/checkout/types'
import type { AccountProfile, AccountWallets, WalletSlot } from './types'

export function toAccountProfile(profile: ProfileDto): AccountProfile {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ensName: profile.ensName,
    walletNickname: profile.walletNickname,
    avatarUrl: profile.avatarUrl ?? undefined,
  }
}

export function toAccountWallets(wallets: WalletsDto): AccountWallets {
  return {
    principal: wallets.principal ?? undefined,
    secundaria: wallets.secundaria ?? undefined,
    secondaryIsPrincipal: wallets.secondaryIsPrincipal,
  }
}

function toSavedWallet(slot: WalletSlot, wallet: WalletRecordDto): SavedWallet {
  return {
    id: slot,
    label: wallet.nickname,
    displayAddress: shortenHex(wallet.address),
    address: wallet.address,
    network: wallet.network,
    provider: wallet.walletType,
  }
}

/** Carteiras oferecidas no pagamento: a secundária some quando é a própria principal. */
export function toSavedWallets({
  principal,
  secundaria,
  secondaryIsPrincipal,
}: WalletsDto): SavedWallet[] {
  return [
    ...(principal ? [toSavedWallet('principal', principal)] : []),
    ...(secundaria && !secondaryIsPrincipal ? [toSavedWallet('secundaria', secundaria)] : []),
  ]
}

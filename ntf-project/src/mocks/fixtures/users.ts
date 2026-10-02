import type { WalletRecordDto } from '@/api/contracts/account'
import type { EditionIdDto } from '@/api/contracts/nfts'

/**
 * Contas fictícias. Só o hash (SHA-256 de "salt:senha") fica aqui; as senhas de demonstração
 * estão documentadas no README e nas fixtures dos testes.
 */
export type UserFixture = {
  id: string
  username: string
  email: string
  displayName: string
  passwordSalt: string
  passwordHash: string
  ensName: string
  walletNickname: string
  wallets: {
    principal: WalletRecordDto | null
    secundaria: WalletRecordDto | null
    secondaryIsPrincipal: boolean
  }
  favorites: string[]
  cart: { nftId: string; editionId: EditionIdDto; quantity: number }[]
}

const COLLECTOR_PRINCIPAL: WalletRecordDto = {
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

export const USER_FIXTURES: UserFixture[] = [
  {
    id: 'usr_colecionador',
    username: 'colecionador',
    email: 'colecionador@kurio.dev',
    displayName: 'Colecionador',
    passwordSalt: 'c0l3c10n4d0r-s4lt',
    passwordHash: 'd7c16dd75a9965a30ca12e0be08d8e647ca26ca4ea7be51da8fd47408f9eafb8',
    ensName: 'colecionador',
    walletNickname: 'Principal',
    wallets: {
      principal: COLLECTOR_PRINCIPAL,
      secundaria: {
        ...COLLECTOR_PRINCIPAL,
        nickname: 'Reserva',
        network: 'polygon',
        address: '0x5c3B9d27E4a1F0c86D2e7B41a9F3c0D58e6A2b17',
        walletType: 'coinbase',
        ensName: 'nova',
      },
      secondaryIsPrincipal: false,
    },
    favorites: ['emerald-ape-042', 'golden-beat-207'],
    cart: [
      { nftId: 'emerald-ape-042', editionId: '1-50', quantity: 2 },
      { nftId: 'violet-nomad-314', editionId: 'aberta', quantity: 6 },
      { nftId: 'ivory-baron-088', editionId: 'aberta', quantity: 9 },
    ],
  },
  {
    id: 'usr_curadora',
    username: 'curadora',
    email: 'curadora@kurio.dev',
    displayName: 'Curadora',
    passwordSalt: 'cur4d0r4-s4lt',
    passwordHash: '8c3cdf0775ff7c51c247cc8943cf718e5203d27fca136e064ea3ceb8f4166b22',
    ensName: '',
    walletNickname: '',
    wallets: { principal: null, secundaria: null, secondaryIsPrincipal: false },
    favorites: [],
    cart: [],
  },
]

/** Cupons conhecidos: um válido e um vencido, para os dois caminhos do carrinho. */
export const COUPON_FIXTURES = [
  {
    code: 'KURIO10',
    description: '10% de desconto no lançamento',
    basisPoints: 1000,
    expiresAt: '2099-12-31T23:59:59.000Z',
  },
  {
    code: 'GENESIS',
    description: '15% de desconto da coleção Genesis',
    basisPoints: 1500,
    expiresAt: '2026-01-31T23:59:59.000Z',
  },
] as const

export const NETWORK_FEE_ETH = { ethereum: '0.016', polygon: '0.004' } as const

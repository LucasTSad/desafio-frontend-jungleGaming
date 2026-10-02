import { z } from 'zod'
import type { CheckoutNetwork, WalletProvider } from './types'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i

export const NOTE_MAX_LENGTH = 280

const required = (message: string) => z.string().trim().min(1, message)
const networkValues = ['ethereum', 'polygon'] as const satisfies readonly CheckoutNetwork[]
const providerValues = [
  'walletconnect',
  'metamask',
  'coinbase',
] as const satisfies readonly WalletProvider[]

export const checkoutSchema = z.object({
  displayName: required('Informe o nome de exibição.').max(40, 'Use no máximo 40 caracteres.'),
  username: required('Informe o nome de usuário.').regex(
    /^[A-Za-z0-9._]{3,20}$/,
    'Use de 3 a 20 letras, números, ponto ou sublinhado.',
  ),
  profileName: required('Informe o nome do perfil.').max(40, 'Use no máximo 40 caracteres.'),
  email: required('Informe seu e-mail.').pipe(
    z.email('Digite um e-mail válido, como nome@exemplo.com.'),
  ),
  walletSource: z.enum(['saved', 'other']),
  savedWalletId: z.string().optional(),
  network: z.enum(networkValues, { error: 'Selecione uma rede.' }),
  walletAddress: required('Informe o endereço da carteira.').regex(
    EVM_ADDRESS,
    'Use um endereço 0x com 40 caracteres hexadecimais.',
  ),
  secondaryWallet: z
    .string()
    .trim()
    .refine((value) => !value || EVM_ADDRESS.test(value) || ENS_NAME.test(value), {
      message: 'Use um nome ENS (nome.eth) ou um endereço 0x.',
    }),
  walletType: z.enum(providerValues, { error: 'Selecione o tipo de carteira.' }),
  referralCode: required('Informe o código de indicação.').regex(
    /^[A-Za-z0-9-]{4,16}$/,
    'Use de 4 a 16 letras, números ou hífen.',
  ),
  ensName: required('Informe o nome ENS.').regex(
    /^[a-z0-9-]{3,}$/,
    'Use pelo menos 3 letras minúsculas, números ou hífen.',
  ),
  note: z.string().max(NOTE_MAX_LENGTH, `Use no máximo ${NOTE_MAX_LENGTH} caracteres.`),
  provider: z.enum(providerValues, { error: 'Escolha a carteira para pagar.' }),
})

export type CheckoutInput = z.input<typeof checkoutSchema>
export type CheckoutValues = z.output<typeof checkoutSchema>

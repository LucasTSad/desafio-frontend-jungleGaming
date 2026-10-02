import { z } from 'zod'
import {
  displayNameField,
  emailField,
  ensLabelField,
  evmAddressField,
  networkField,
  referralCodeField,
  requiredText,
  secondaryWalletField,
  usernameField,
  walletTypeField,
} from '@/lib/form-validators'

export const NOTE_MAX_LENGTH = 280

export const checkoutSchema = z.object({
  displayName: displayNameField,
  username: usernameField,
  profileName: requiredText('Informe o nome do perfil.').max(40, 'Use no máximo 40 caracteres.'),
  email: emailField,
  walletSource: z.enum(['saved', 'other']),
  savedWalletId: z.string().optional(),
  network: networkField,
  walletAddress: evmAddressField,
  secondaryWallet: secondaryWalletField,
  walletType: walletTypeField,
  referralCode: referralCodeField,
  ensName: ensLabelField,
  note: z.string().max(NOTE_MAX_LENGTH, `Use no máximo ${NOTE_MAX_LENGTH} caracteres.`),
  provider: z.enum(['walletconnect', 'metamask', 'coinbase'], {
    error: 'Escolha a carteira para pagar.',
  }),
})

export type CheckoutInput = z.input<typeof checkoutSchema>
export type CheckoutValues = z.output<typeof checkoutSchema>

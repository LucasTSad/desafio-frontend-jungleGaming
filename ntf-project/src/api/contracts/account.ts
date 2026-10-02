import { z } from 'zod'
import {
  displayNameField,
  emailField,
  ensLabelField,
  evmAddressField,
  networkField,
  newPasswordField,
  optionalEnsLabelField,
  referralCodeField,
  requiredText,
  secondaryWalletField,
  usernameField,
  walletTypeField,
} from '@/lib/form-validators'
import { checkoutNetworkSchema, walletProviderSchema } from './checkout'

export const profileSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  /** Parte do nome ENS antes de ".eth"; vazio quando não informado. */
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  version: z.number().int(),
})

const walletNicknameField = requiredText('Informe o apelido da carteira.').max(
  30,
  'Use no máximo 30 caracteres.',
)

export const updateProfileRequestSchema = z
  .object({
    displayName: displayNameField,
    username: usernameField,
    email: emailField.transform((value) => value.toLowerCase()),
    ensName: optionalEnsLabelField,
    walletNickname: walletNicknameField,
  })
  .partial()

export const avatarResponseSchema = z.object({ avatarUrl: z.string() })

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual para trocar a senha.'),
  newPassword: newPasswordField,
})

export const walletSlotSchema = z.enum(['principal', 'secundaria'])

export const walletRecordSchema = z.object({
  nickname: z.string(),
  displayName: z.string(),
  profileName: z.string(),
  network: checkoutNetworkSchema,
  address: z.string(),
  /** Vazio quando não informada. */
  secondaryWallet: z.string(),
  walletType: walletProviderSchema,
  referralCode: z.string(),
  email: z.string(),
  ensName: z.string(),
})

export const walletInputSchema = z.object({
  nickname: walletNicknameField,
  displayName: displayNameField,
  profileName: requiredText('Informe o nome do perfil.'),
  network: networkField,
  address: evmAddressField,
  secondaryWallet: secondaryWalletField,
  walletType: walletTypeField,
  referralCode: referralCodeField,
  email: emailField,
  ensName: ensLabelField,
})

export const walletsSchema = z.object({
  principal: walletRecordSchema.nullable(),
  secundaria: walletRecordSchema.nullable(),
  /** A principal também faz o papel de secundária; a secundária cadastrada fica guardada. */
  secondaryIsPrincipal: z.boolean(),
})

export const updateWalletsRequestSchema = z.object({ secondaryIsPrincipal: z.boolean() })

export type ProfileDto = z.infer<typeof profileSchema>
export type UpdateProfileRequest = z.input<typeof updateProfileRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
export type WalletSlotDto = z.infer<typeof walletSlotSchema>
export type WalletRecordDto = z.infer<typeof walletRecordSchema>
export type WalletInputDto = z.input<typeof walletInputSchema>
export type WalletsDto = z.infer<typeof walletsSchema>

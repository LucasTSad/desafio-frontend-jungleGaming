import { z } from 'zod'
import {
  displayNameField,
  emailField,
  ensLabelField,
  evmAddressField,
  networkField,
  optionalEnsLabelField,
  referralCodeField,
  requiredText,
  secondaryWalletField,
  usernameField,
  walletTypeField,
} from '@/lib/form-validators'

const nicknameField = requiredText('Informe o apelido da carteira.').max(
  30,
  'Use no máximo 30 caracteres.',
)

type PasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string }

// As regras de senha rodam mesmo com erro em outros campos e só quando alguma senha é preenchida.
const passwordCheck = (test: (values: PasswordValues) => boolean) => ({
  when: () => true,
  test: (values: PasswordValues) => {
    const changing = values.currentPassword || values.newPassword || values.confirmPassword
    return !changing || test(values)
  },
})

const currentRequired = passwordCheck((values) => values.currentPassword.length > 0)
const newLength = passwordCheck((values) => values.newPassword.length >= 8)
const newLetter = passwordCheck((values) => /[A-Za-z]/.test(values.newPassword))
const newDigit = passwordCheck((values) => /\d/.test(values.newPassword))
const newDiffers = passwordCheck((values) => values.newPassword !== values.currentPassword)
const confirmMatches = passwordCheck((values) => values.confirmPassword === values.newPassword)

export const profileSchema = z
  .object({
    displayName: displayNameField,
    username: usernameField,
    email: emailField,
    ensName: optionalEnsLabelField,
    walletNickname: nicknameField,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .refine(currentRequired.test, {
    message: 'Informe a senha atual para trocar a senha.',
    path: ['currentPassword'],
    when: currentRequired.when,
  })
  .refine(newLength.test, {
    message: 'A nova senha precisa ter pelo menos 8 caracteres.',
    path: ['newPassword'],
    when: newLength.when,
  })
  .refine(newLetter.test, {
    message: 'Inclua pelo menos uma letra na nova senha.',
    path: ['newPassword'],
    when: newLetter.when,
  })
  .refine(newDigit.test, {
    message: 'Inclua pelo menos um número na nova senha.',
    path: ['newPassword'],
    when: newDigit.when,
  })
  .refine(newDiffers.test, {
    message: 'A nova senha precisa ser diferente da atual.',
    path: ['newPassword'],
    when: newDiffers.when,
  })
  .refine(confirmMatches.test, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
    when: confirmMatches.when,
  })

export const walletSchema = z.object({
  nickname: nicknameField,
  displayName: displayNameField,
  profileName: requiredText('Informe o nome do perfil.').max(40, 'Use no máximo 40 caracteres.'),
  network: networkField,
  address: evmAddressField,
  secondaryWallet: secondaryWalletField,
  walletType: walletTypeField,
  referralCode: referralCodeField,
  email: emailField,
  ensName: ensLabelField,
})

export type ProfileInput = z.input<typeof profileSchema>
export type ProfileValues = z.output<typeof profileSchema>
export type WalletInput = z.input<typeof walletSchema>
export type WalletValues = z.output<typeof walletSchema>

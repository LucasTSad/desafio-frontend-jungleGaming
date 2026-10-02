import { z } from 'zod'

// Regras de campo repetidas entre pagamento, perfil e carteiras.

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const ENS_NAME = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i
const ENS_LABEL = /^[a-z0-9-]{3,}$/
const ENS_LABEL_MESSAGE = 'Use pelo menos 3 letras minúsculas, números ou hífen.'

export const requiredText = (message: string) => z.string().trim().min(1, message)

export const displayNameField = requiredText('Informe o nome de exibição.').max(
  40,
  'Use no máximo 40 caracteres.',
)

export const usernameField = requiredText('Informe o nome de usuário.').regex(
  /^[A-Za-z0-9._]{3,20}$/,
  'Use de 3 a 20 letras, números, ponto ou sublinhado.',
)

export const emailField = requiredText('Informe seu e-mail.').pipe(
  z.email('Digite um e-mail válido, como nome@exemplo.com.'),
)

export const evmAddressField = requiredText('Informe o endereço da carteira.').regex(
  EVM_ADDRESS,
  'Use um endereço 0x com 40 caracteres hexadecimais.',
)

export const secondaryWalletField = z
  .string()
  .trim()
  .refine((value) => !value || EVM_ADDRESS.test(value) || ENS_NAME.test(value), {
    message: 'Use um nome ENS (nome.eth) ou um endereço 0x.',
  })

export const referralCodeField = requiredText('Informe o código de indicação.').regex(
  /^[A-Za-z0-9-]{4,16}$/,
  'Use de 4 a 16 letras, números ou hífen.',
)

/** Parte do nome ENS antes do sufixo ".eth", que é fixo na interface. */
export const ensLabelField = requiredText('Informe o nome ENS.').regex(ENS_LABEL, ENS_LABEL_MESSAGE)

export const optionalEnsLabelField = z
  .string()
  .trim()
  .refine((value) => !value || ENS_LABEL.test(value), { message: ENS_LABEL_MESSAGE })

export const networkField = z.enum(['ethereum', 'polygon'], { error: 'Selecione uma rede.' })

export const walletTypeField = z.enum(['walletconnect', 'metamask', 'coinbase'], {
  error: 'Selecione o tipo de carteira.',
})

export const PASSWORD_RULES_HINT = 'Mínimo de 8 caracteres, com letras e números.'

export const newPasswordField = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra na senha.')
  .regex(/\d/, 'Inclua pelo menos um número na senha.')

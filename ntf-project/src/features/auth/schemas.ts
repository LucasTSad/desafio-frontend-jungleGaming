import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Digite um e-mail válido, como nome@exemplo.com.'))
  .transform((value) => value.toLowerCase())

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const PASSWORD_HINT = 'Mínimo de 8 caracteres, com letras e números.'

export const signUpSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, 'Informe um nome de usuário.')
      .min(3, 'Use pelo menos 3 caracteres.')
      .max(20, 'Use no máximo 20 caracteres.')
      .regex(/^[A-Za-z0-9._]+$/, 'Use apenas letras, números, ponto ou sublinhado.'),
    email: emailField,
    password: z
      .string()
      .min(1, 'Crie uma senha.')
      .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
      .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra na senha.')
      .regex(/\d/, 'Inclua pelo menos um número na senha.'),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
    // Compara as senhas mesmo quando outros campos ainda têm erro.
    when: ({ value }) => {
      const { password, confirmPassword } = value as Record<string, unknown>
      return (
        typeof password === 'string' && typeof confirmPassword === 'string' && !!confirmPassword
      )
    },
  })

export type SignInInput = z.input<typeof signInSchema>
export type SignInValues = z.output<typeof signInSchema>
export type SignUpInput = z.input<typeof signUpSchema>
export type SignUpValues = z.output<typeof signUpSchema>

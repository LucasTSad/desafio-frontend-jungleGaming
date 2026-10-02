import { z } from 'zod'
import { emailField, newPasswordField, usernameField } from '@/lib/form-validators'
import { isoDate } from './common'

export const userSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
})

export const sessionSchema = z.object({
  token: z.string(),
  expiresAt: isoDate,
})

export const authResponseSchema = z.object({
  session: sessionSchema,
  user: userSchema,
})

export const currentSessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDate,
})

export const registerRequestSchema = z.object({
  username: usernameField,
  email: emailField.transform((value) => value.toLowerCase()),
  password: newPasswordField,
})

export const loginRequestSchema = z.object({
  email: emailField.transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Informe sua senha.'),
})

export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
export type AuthResponse = z.infer<typeof authResponseSchema>
export type CurrentSession = z.infer<typeof currentSessionSchema>
export type RegisterRequest = z.input<typeof registerRequestSchema>
export type LoginRequest = z.input<typeof loginRequestSchema>

import { z } from 'zod'
import { ETH_PATTERN } from '@/lib/eth'

/** Valor em ETH como string decimal com até 18 casas (ex.: "1.19"). */
export const ethAmount = z.string().regex(ETH_PATTERN, 'Valor em ETH inválido.')

export const isoDate = z.iso.datetime()

export const artworkSchema = z.object({
  src: z.string(),
  alt: z.string(),
})

export const ERROR_CODES = [
  'BAD_REQUEST',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'INVALID_CREDENTIALS',
  'FORBIDDEN',
  'NOT_FOUND',
  'EMAIL_TAKEN',
  'USERNAME_TAKEN',
  'ADDRESS_IN_USE',
  'AVAILABILITY_CONFLICT',
  'QUOTE_CHANGED',
  'IDEMPOTENCY_KEY_REUSED',
  'WALLET_REJECTED',
  'QUOTE_EXPIRED',
  'VALIDATION_ERROR',
  'COUPON_INVALID',
  'COUPON_EXPIRED',
  'INVALID_CURRENT_PASSWORD',
  'SERVICE_UNAVAILABLE',
] as const

export const errorCodeSchema = z.enum(ERROR_CODES)

export type ErrorCode = z.infer<typeof errorCodeSchema>

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    details: z.unknown().optional(),
    retryable: z.boolean(),
  }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/** Status HTTP de cada código de erro, compartilhado entre os handlers do mock e a documentação. */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  USERNAME_TAKEN: 409,
  ADDRESS_IN_USE: 409,
  AVAILABILITY_CONFLICT: 409,
  QUOTE_CHANGED: 409,
  IDEMPOTENCY_KEY_REUSED: 409,
  WALLET_REJECTED: 409,
  QUOTE_EXPIRED: 410,
  VALIDATION_ERROR: 422,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  INVALID_CURRENT_PASSWORD: 422,
  SERVICE_UNAVAILABLE: 503,
}

export const healthSchema = z.object({
  status: z.literal('ok'),
  scenario: z.string(),
  seed: z.number(),
})

import { z } from 'zod'
import { requiredText } from '@/lib/form-validators'
import { couponSchema, totalsSchema } from './cart'
import { checkoutNetworkSchema, quoteLineSchema, walletProviderSchema } from './checkout'
import { isoDate } from './common'

export const orderStatusSchema = z.enum(['pending', 'confirmed', 'refused'])

/** Retrato imutável do pedido: o recibo não muda se o catálogo mudar depois. */
export const orderSchema = z.object({
  id: z.string(),
  version: z.number().int(),
  status: orderStatusSchema,
  createdAt: isoDate,
  updatedAt: isoDate,
  network: checkoutNetworkSchema,
  provider: walletProviderSchema,
  walletAddress: z.string(),
  transactionHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  lines: z.array(quoteLineSchema),
  coupon: couponSchema.nullable(),
  totals: totalsSchema,
  failureReason: z.string().nullable(),
})

export const collectorSchema = z.object({
  displayName: requiredText('Informe o nome de exibição.'),
  username: requiredText('Informe o nome de usuário.'),
  profileName: requiredText('Informe o nome do perfil.'),
  email: requiredText('Informe seu e-mail.'),
  ensName: requiredText('Informe o nome ENS.'),
  referralCode: requiredText('Informe o código de indicação.'),
  secondaryWallet: z.string(),
})

export const createOrderRequestSchema = z.object({
  quoteId: z.string().min(1),
  walletConnectionId: z.string().min(1),
  collector: collectorSchema,
  note: z.string().max(280).default(''),
})

export const orderListSchema = z.object({ items: z.array(orderSchema) })

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

export type OrderDto = z.infer<typeof orderSchema>
export type OrderStatusDto = z.infer<typeof orderStatusSchema>
export type CreateOrderRequest = z.input<typeof createOrderRequestSchema>

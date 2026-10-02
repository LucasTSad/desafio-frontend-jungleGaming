import { z } from 'zod'
import { evmAddressField, networkField, walletTypeField } from '@/lib/form-validators'
import { couponSchema, totalsSchema } from './cart'
import { artworkSchema, ethAmount, isoDate } from './common'
import { editionIdSchema } from './nfts'

export const checkoutNetworkSchema = z.enum(['ethereum', 'polygon'])
export const walletProviderSchema = z.enum(['walletconnect', 'metamask', 'coinbase'])

export const quoteLineSchema = z.object({
  lineId: z.string(),
  nftId: z.string(),
  editionId: editionIdSchema,
  name: z.string(),
  artwork: artworkSchema,
  tokenId: z.string(),
  editionLabel: z.string(),
  quantity: z.number().int().min(1),
  unitPriceEth: ethAmount,
  subtotalEth: ethAmount,
})

/** Cotação revalidada que a revisão mostra e que o pedido congela. */
export const quoteSchema = z.object({
  id: z.string(),
  expiresAt: isoDate,
  cartVersion: z.number().int(),
  network: checkoutNetworkSchema,
  lines: z.array(quoteLineSchema),
  coupon: couponSchema.nullable(),
  totals: totalsSchema,
})

export const quoteRequestSchema = z.object({
  network: networkField,
  cartVersion: z.number().int(),
})

export const walletConnectionRequestSchema = z.object({
  provider: walletTypeField,
  network: networkField,
  address: evmAddressField,
})

export const walletConnectionSchema = z.object({
  id: z.string(),
  provider: walletProviderSchema,
  network: checkoutNetworkSchema,
  address: z.string(),
  expiresAt: isoDate,
})

export type QuoteDto = z.infer<typeof quoteSchema>
export type QuoteLineDto = z.infer<typeof quoteLineSchema>
export type QuoteRequest = z.infer<typeof quoteRequestSchema>
export type WalletConnectionRequest = z.input<typeof walletConnectionRequestSchema>
export type WalletConnectionDto = z.infer<typeof walletConnectionSchema>
export type CheckoutNetworkDto = z.infer<typeof checkoutNetworkSchema>
export type WalletProviderDto = z.infer<typeof walletProviderSchema>

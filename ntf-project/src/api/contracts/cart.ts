import { z } from 'zod'
import { artworkSchema, ethAmount } from './common'
import { editionIdSchema } from './nfts'

export const totalsSchema = z.object({
  subtotalEth: ethAmount,
  discountEth: ethAmount,
  networkFeeEth: ethAmount,
  totalEth: ethAmount,
})

export const couponSchema = z.object({
  code: z.string(),
  description: z.string(),
})

export const cartLineStatusSchema = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('price-changed'), previousPriceEth: ethAmount }),
    z.object({ kind: z.literal('unavailable') }),
  ])
  .nullable()

export const cartLineSchema = z.object({
  id: z.string(),
  nftId: z.string(),
  nftVersion: z.number().int(),
  name: z.string(),
  artwork: artworkSchema,
  tokenId: z.string(),
  edition: z.object({ id: editionIdSchema, label: z.string() }),
  quantity: z.number().int().min(1),
  maxQuantity: z.number().int().nonnegative(),
  unitPriceEth: ethAmount,
  status: cartLineStatusSchema,
})

export const cartSchema = z.object({
  id: z.string(),
  version: z.number().int(),
  lines: z.array(cartLineSchema),
  coupon: couponSchema.nullable(),
  totals: totalsSchema,
})

export const addCartItemRequestSchema = z.object({
  nftId: z.string().min(1),
  editionId: editionIdSchema,
  quantity: z.number().int().min(1),
})

export const updateCartItemRequestSchema = z.union([
  z.object({ quantity: z.number().int().min(1) }),
  z.object({ acceptPrice: z.literal(true) }),
])

export const applyCouponRequestSchema = z.object({
  code: z.string().trim().min(1, 'Informe o código promocional.').max(32),
})

export const mergeCartRequestSchema = z.object({ guestCartId: z.string().min(1) })

export const cartAdjustmentSchema = z.object({
  nftId: z.string(),
  editionId: editionIdSchema,
  requested: z.number().int(),
  kept: z.number().int(),
})

export const mergeCartResponseSchema = z.object({
  cart: cartSchema,
  adjustments: z.array(cartAdjustmentSchema),
})

export const CART_ID_HEADER = 'X-Cart-Id'

export type CartDto = z.infer<typeof cartSchema>
export type CartLineDto = z.infer<typeof cartLineSchema>
export type TotalsDto = z.infer<typeof totalsSchema>
export type CouponDto = z.infer<typeof couponSchema>
export type AddCartItemRequest = z.infer<typeof addCartItemRequestSchema>
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>
export type MergeCartResponse = z.infer<typeof mergeCartResponseSchema>

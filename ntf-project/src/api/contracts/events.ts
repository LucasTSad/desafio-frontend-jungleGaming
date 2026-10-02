import { z } from 'zod'
import { ethAmount, isoDate } from './common'
import { editionIdSchema } from './nfts'
import { orderStatusSchema } from './orders'

function envelope<TType extends string, TResource extends string, TData extends z.ZodType>(
  type: TType,
  resource: TResource,
  data: TData,
) {
  return z.object({
    /** Identidade estável: o mesmo evento reenviado é ignorado. */
    eventId: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string() }),
    /** Eventos com versão menor ou igual à já conhecida são ignorados. */
    version: z.number().int(),
    occurredAt: isoDate,
    data,
  })
}

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    priceEth: ethAmount,
    previousPriceEth: ethAmount.nullable(),
    editions: z.array(
      z.object({ id: editionIdSchema, available: z.number().int().nonnegative().nullable() }),
    ),
  }),
)

export const orderUpdatedEventSchema = envelope(
  'order.updated',
  'order',
  z.object({
    status: orderStatusSchema,
    transactionHash: z.string().nullable(),
    failureReason: z.string().nullable(),
  }),
)

export const walletDisconnectedEventSchema = envelope(
  'wallet.disconnected',
  'wallet-connection',
  z.object({ reason: z.string() }),
)

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
export type WalletDisconnectedEvent = z.infer<typeof walletDisconnectedEventSchema>
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent | WalletDisconnectedEvent

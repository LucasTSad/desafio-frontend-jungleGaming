import { z } from 'zod'
import { nftSummarySchema } from './nfts'

export const favoritesSchema = z.object({ items: z.array(nftSummarySchema) })

export type FavoritesDto = z.infer<typeof favoritesSchema>

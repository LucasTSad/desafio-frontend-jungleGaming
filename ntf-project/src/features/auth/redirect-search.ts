import { z } from 'zod'

// Aceita apenas caminhos internos para evitar redirecionamento aberto para outros domínios.
export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?!\/)/)
    .optional()
    .catch(undefined),
})

export type RedirectSearch = z.infer<typeof redirectSearchSchema>

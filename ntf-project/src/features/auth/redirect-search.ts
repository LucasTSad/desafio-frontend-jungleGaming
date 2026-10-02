import { z } from 'zod'

// Aceita apenas caminhos internos para evitar redirecionamento aberto para outros domínios
// (inclui "/\", que os navegadores tratam como "//").
export const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .regex(/^\/(?![/\\])/)
    .optional()
    .catch(undefined),
})

export type RedirectSearch = z.infer<typeof redirectSearchSchema>

/** Destino após autenticar; evita voltar para as próprias telas de acesso. */
export function resolveRedirect(redirect: string | undefined) {
  if (!redirect || /^\/(entrar|cadastro)(?=$|[/?#])/.test(redirect)) return '/'
  return redirect
}

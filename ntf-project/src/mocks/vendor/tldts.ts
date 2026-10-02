/**
 * Substitui o pacote `tldts` no build (alias no vite.config.ts). Ele só chega ao app pelo
 * `tough-cookie`, que o MSW usa para guardar os cookies das respostas simuladas, e traz a lista
 * completa de sufixos públicos (~245 KB de JS). A API simulada não usa cookies, então a lista não
 * é necessária: sem ela, nenhum host é reconhecido como domínio registrável, e o `tough-cookie`
 * aceita só cookies sem o atributo `Domain`.
 */
export function getDomain(): string | null {
  return null
}

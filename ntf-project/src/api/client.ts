import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { CART_ID_HEADER } from './contracts/cart'
import { toApiError } from './errors'
import { API_BASE_URL } from './paths'

export const REQUEST_TIMEOUT_MS = 10_000

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: 'application/json' },
})

type Credentials = {
  getToken: () => string | null
  getCartId: () => string | null
}

let credentials: Credentials = { getToken: () => null, getCartId: () => null }

/** A camada de sessão informa como obter o token e o carrinho do visitante a cada requisição. */
export function configureCredentials(next: Credentials) {
  credentials = next
}

http.interceptors.request.use((config) => {
  const token = credentials.getToken()
  const cartId = credentials.getCartId()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  if (cartId) config.headers.set(CART_ID_HEADER, cartId)
  return config
})

/**
 * Faz a requisição e valida a resposta com o contrato: o que chega às telas já está tipado e
 * conferido. Qualquer falha vira ApiError (cancelamentos seguem como estão).
 */
export async function apiRequest<TSchema extends z.ZodType>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<z.output<TSchema>> {
  try {
    const response = await http.request(config)
    return schema.parse(response.data)
  } catch (error) {
    throw toApiError(error)
  }
}

/** Para respostas sem corpo (204). */
export async function apiSend(config: AxiosRequestConfig): Promise<void> {
  try {
    await http.request(config)
  } catch (error) {
    throw toApiError(error)
  }
}

import {
  delay,
  http,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type PathParams,
} from 'msw'
import { ERROR_STATUS, type ApiErrorBody, type ErrorCode } from '@/api/contracts/common'
import { API_BASE_URL } from '@/api/paths'
import { currentNetwork, nextLatency, shouldFailFlaky } from './scenarios'

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`

type ErrorOptions = { fields?: Record<string, string>; details?: unknown }

export function apiError(code: ErrorCode, message: string, options: ErrorOptions = {}) {
  const body: ApiErrorBody = {
    error: { code, message, ...options, retryable: code === 'SERVICE_UNAVAILABLE' },
  }
  return HttpResponse.json(body, { status: ERROR_STATUS[code] })
}

/** Lançado dentro de um handler para responder com o envelope de erro sem montar a resposta. */
export class MockApiError extends Error {
  readonly code: ErrorCode
  readonly options: ErrorOptions

  constructor(code: ErrorCode, message: string, options: ErrorOptions = {}) {
    super(message)
    this.code = code
    this.options = options
  }
}

/**
 * Envolve um resolver com as condições de rede do cenário ativo (latência, offline, 503,
 * instabilidade) e converte MockApiError no envelope de erro da API.
 */
export function withNetwork<P extends PathParams, B extends DefaultBodyType>(
  resolver: HttpResponseResolver<P, B>,
): HttpResponseResolver<P, B> {
  return async (info) => {
    await delay(nextLatency())
    const { failure } = currentNetwork()
    const { method, url } = info.request
    if (failure === 'offline') return HttpResponse.error()
    if (failure === 'error' || (failure === 'flaky' && shouldFailFlaky(`${method} ${url}`))) {
      return apiError(
        'SERVICE_UNAVAILABLE',
        'O serviço está indisponível no momento. Tente novamente.',
      )
    }
    try {
      return await resolver(info)
    } catch (error) {
      if (error instanceof MockApiError) return apiError(error.code, error.message, error.options)
      throw error
    }
  }
}

/** Atalhos que registram o handler já com as condições de rede aplicadas. */
export const api = {
  get: <P extends PathParams = PathParams>(path: string, resolver: HttpResponseResolver<P>) =>
    http.get(apiUrl(path), withNetwork(resolver)),
  post: <P extends PathParams = PathParams>(path: string, resolver: HttpResponseResolver<P>) =>
    http.post(apiUrl(path), withNetwork(resolver)),
  put: <P extends PathParams = PathParams>(path: string, resolver: HttpResponseResolver<P>) =>
    http.put(apiUrl(path), withNetwork(resolver)),
  patch: <P extends PathParams = PathParams>(path: string, resolver: HttpResponseResolver<P>) =>
    http.patch(apiUrl(path), withNetwork(resolver)),
  delete: <P extends PathParams = PathParams>(path: string, resolver: HttpResponseResolver<P>) =>
    http.delete(apiUrl(path), withNetwork(resolver)),
}

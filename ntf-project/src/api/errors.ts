import { isAxiosError, isCancel } from 'axios'
import { z } from 'zod'
import { apiErrorBodySchema, type ErrorCode } from './contracts/common'

/** Falhas sem resposta da API, normalizadas pelo cliente. */
export type ClientErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE'

type ApiErrorInit = {
  code: ErrorCode | ClientErrorCode
  message: string
  status?: number
  fields?: Record<string, string>
  details?: unknown
  retryable: boolean
}

/** Erro único que hooks e telas recebem, venha ele da API, da rede ou de um contrato quebrado. */
export class ApiError extends Error {
  readonly code: ErrorCode | ClientErrorCode
  readonly status?: number
  readonly fields?: Record<string, string>
  readonly details?: unknown
  readonly retryable: boolean

  constructor(init: ApiErrorInit) {
    super(init.message)
    this.name = 'ApiError'
    this.code = init.code
    this.status = init.status
    this.fields = init.fields
    this.details = init.details
    this.retryable = init.retryable
  }
}

export function isApiError(error: unknown, code?: ApiError['code']): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code)
}

const OFFLINE_MESSAGE = 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
const TIMEOUT_MESSAGE = 'O servidor demorou para responder. Tente novamente.'

/** Converte qualquer falha de requisição em ApiError; cancelamentos seguem como estão. */
export function toApiError(error: unknown): unknown {
  if (error instanceof ApiError || isCancel(error)) return error

  if (error instanceof z.ZodError) {
    return new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'Recebemos uma resposta inesperada do servidor. Tente novamente.',
      details: error.issues,
      retryable: false,
    })
  }

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ code: 'TIMEOUT', message: TIMEOUT_MESSAGE, retryable: true })
    }
    if (!error.response) {
      return new ApiError({ code: 'NETWORK_ERROR', message: OFFLINE_MESSAGE, retryable: true })
    }
    const body = apiErrorBodySchema.safeParse(error.response.data)
    if (body.success) {
      return new ApiError({ ...body.data.error, status: error.response.status })
    }
    return new ApiError({
      code: 'INVALID_RESPONSE',
      message: 'Algo deu errado do nosso lado. Tente novamente.',
      status: error.response.status,
      retryable: error.response.status >= 500,
    })
  }

  return error
}

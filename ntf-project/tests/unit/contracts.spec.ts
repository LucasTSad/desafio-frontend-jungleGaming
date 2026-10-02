import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { AxiosError, AxiosHeaders, CanceledError } from 'axios'
import { z } from 'zod'
import { registerRequestSchema } from '@/api/contracts/auth'
import { cartSchema } from '@/api/contracts/cart'
import { ERROR_CODES, ERROR_STATUS, ethAmount } from '@/api/contracts/common'
import { nftUpdatedEventSchema } from '@/api/contracts/events'
import { ApiError, toApiError } from '@/api/errors'
import { USER_FIXTURES } from '@/mocks/fixtures/users'
import { ACCOUNTS } from '../fixtures/accounts'

function axiosError(status?: number, data?: unknown, code?: string) {
  const config = { headers: new AxiosHeaders() }
  const response = status ? { status, statusText: '', headers: {}, config, data } : undefined
  return new AxiosError('falha', code, config, undefined, response)
}

test.describe('contratos', () => {
  test('ETH trafega como string decimal', () => {
    expect(ethAmount.safeParse('1.19').success).toBe(true)
    expect(ethAmount.safeParse(1.19).success).toBe(false)
    expect(ethAmount.safeParse('1,19').success).toBe(false)
  })

  test('todo código de erro tem status HTTP', () => {
    for (const code of ERROR_CODES) expect(ERROR_STATUS[code], code).toBeGreaterThanOrEqual(400)
  })

  test('cadastro devolve as mesmas mensagens dos formulários', () => {
    const result = registerRequestSchema.safeParse({ username: 'a', email: 'x', password: 'abc' })
    expect(result.success).toBe(false)
    const fields = z.flattenError(result.error!).fieldErrors
    expect(fields.username?.[0]).toBe('Use de 3 a 20 letras, números, ponto ou sublinhado.')
    expect(fields.email?.[0]).toBe('Digite um e-mail válido, como nome@exemplo.com.')
    expect(fields.password?.[0]).toBe('A senha precisa ter pelo menos 8 caracteres.')
  })

  test('carrinho recusa total numérico e status desconhecido', () => {
    const totals = { subtotalEth: '1', discountEth: '0', networkFeeEth: '0.016', totalEth: '1.016' }
    const base = { id: 'c1', version: 1, lines: [], coupon: null, totals }
    expect(cartSchema.safeParse(base).success).toBe(true)
    expect(cartSchema.safeParse({ ...base, totals: { ...totals, totalEth: 1.016 } }).success).toBe(
      false,
    )
  })

  test('evento traz identidade, recurso e versão', () => {
    const event = {
      eventId: 'evt_1',
      type: 'nft.updated',
      resource: { type: 'nft', id: 'emerald-ape-042' },
      version: 2,
      occurredAt: '2026-10-02T12:00:00.000Z',
      data: {
        priceEth: '1.29',
        previousPriceEth: '1.19',
        editions: [{ id: '1-50', available: 3 }],
      },
    }
    expect(nftUpdatedEventSchema.safeParse(event).success).toBe(true)
    expect(nftUpdatedEventSchema.safeParse({ ...event, version: undefined }).success).toBe(false)
  })
})

test.describe('normalização de erros', () => {
  test('erro da API vira ApiError com código, campos e status', () => {
    const body = {
      error: {
        code: 'EMAIL_TAKEN',
        message: 'Este e-mail já está em uso.',
        fields: { email: 'Este e-mail já está em uso.' },
        retryable: false,
      },
    }
    const error = toApiError(axiosError(409, body))
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      code: 'EMAIL_TAKEN',
      status: 409,
      retryable: false,
      fields: { email: 'Este e-mail já está em uso.' },
    })
  })

  test('sem resposta vira NETWORK_ERROR e timeout vira TIMEOUT, ambos repetíveis', () => {
    expect(toApiError(axiosError())).toMatchObject({ code: 'NETWORK_ERROR', retryable: true })
    expect(toApiError(axiosError(undefined, undefined, 'ECONNABORTED'))).toMatchObject({
      code: 'TIMEOUT',
      retryable: true,
    })
  })

  test('resposta fora do contrato vira INVALID_RESPONSE', () => {
    expect(toApiError(axiosError(500, '<html>'))).toMatchObject({
      code: 'INVALID_RESPONSE',
      retryable: true,
    })
    expect(toApiError(new z.ZodError([]))).toMatchObject({
      code: 'INVALID_RESPONSE',
      retryable: false,
    })
  })

  test('cancelamento não vira erro de API', () => {
    const canceled = new CanceledError()
    expect(toApiError(canceled)).toBe(canceled)
  })
})

test('as senhas de demonstração conferem com os hashes das fixtures', () => {
  for (const account of Object.values(ACCOUNTS)) {
    const fixture = USER_FIXTURES.find((user) => user.email === account.email)
    const hash = createHash('sha256').update(`${account.salt}:${account.password}`).digest('hex')
    expect(fixture?.passwordHash, account.email).toBe(hash)
  }
})

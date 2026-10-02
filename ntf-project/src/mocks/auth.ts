import { z } from 'zod'
import type { ProfileDto } from '@/api/contracts/account'
import type { Session, User } from '@/api/contracts/auth'
import { db, mockClock } from './db/store'
import type { UserRecord } from './db/types'
import { MockApiError } from './respond'
import { getScenarioActivatedAt, isScenario } from './scenarios'

/** Validade da sessão, renovada a cada requisição autenticada. */
export const SESSION_TTL_MS = 30 * 60_000

const EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.'

export function toUserDto(user: UserRecord): User {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
  }
}

export function toProfileDto(user: UserRecord): ProfileDto {
  return {
    displayName: user.displayName,
    username: user.username,
    email: user.email,
    ensName: user.ensName,
    walletNickname: user.walletNickname,
    avatarUrl: user.avatarUrl,
    version: user.profileVersion,
  }
}

function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export function createSession(userId: string): Session {
  const token = randomToken()
  const expiresAt = mockClock.iso(SESSION_TTL_MS)
  db.update((draft) => {
    draft.sessions[token] = { token, userId, createdAt: mockClock.now(), expiresAt }
  })
  return { token, expiresAt }
}

function bearerToken(request: Request) {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

/**
 * Identifica o usuário da requisição. Sessões vencidas, ou criadas antes de o cenário
 * "sessao-expirada" ser ativado, respondem SESSION_EXPIRED; as válidas têm a validade renovada.
 */
export function requireUser(request: Request): UserRecord {
  const token = bearerToken(request)
  if (!token) throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')

  const session = db.get().sessions[token]
  if (!session) throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')

  const forcedExpiry = isScenario('sessao-expirada') && session.createdAt < getScenarioActivatedAt()
  if (forcedExpiry || Date.parse(session.expiresAt) <= mockClock.now()) {
    db.update((draft) => {
      delete draft.sessions[token]
    })
    throw new MockApiError('SESSION_EXPIRED', EXPIRED_MESSAGE)
  }

  const user = db.get().users[session.userId]
  if (!user) throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')

  db.update((draft) => {
    const current = draft.sessions[token]
    if (current) current.expiresAt = mockClock.iso(SESSION_TTL_MS)
  })
  return user
}

export function sessionExpiresAt(request: Request) {
  const token = bearerToken(request)
  return (token && db.get().sessions[token]?.expiresAt) || mockClock.iso(SESSION_TTL_MS)
}

export function endSession(request: Request) {
  const token = bearerToken(request)
  if (!token) return
  db.update((draft) => {
    delete draft.sessions[token]
  })
}

/** Lê e valida o corpo JSON; erros de campo voltam como VALIDATION_ERROR com `fields`. */
export async function readBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.output<TSchema>> {
  const body: unknown = await request.json().catch(() => undefined)
  const result = schema.safeParse(body)
  if (result.success) return result.data
  throw validationError(result.error)
}

export function validationError(error: z.ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    fields[key] ??= issue.message
  }
  return new MockApiError('VALIDATION_ERROR', 'Revise os campos destacados.', { fields })
}

export function findUserByEmail(email: string, exceptId?: string) {
  return Object.values(db.get().users).find(
    (user) => user.email === email.toLowerCase() && user.id !== exceptId,
  )
}

export function findUserByUsername(username: string, exceptId?: string) {
  return Object.values(db.get().users).find(
    (user) => user.username.toLowerCase() === username.toLowerCase() && user.id !== exceptId,
  )
}

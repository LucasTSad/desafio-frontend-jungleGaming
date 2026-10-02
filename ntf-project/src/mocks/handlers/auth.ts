import { HttpResponse } from 'msw'
import { loginRequestSchema, registerRequestSchema } from '@/api/contracts/auth'
import { API_PATHS } from '@/api/paths'
import {
  createSession,
  endSession,
  findUserByEmail,
  findUserByUsername,
  readBody,
  requireUser,
  sessionExpiresAt,
  toUserDto,
} from '../auth'
import { db } from '../db/store'
import { createSalt, hashPassword, verifyPassword } from '../password'
import { api, MockApiError } from '../respond'

export const EMAIL_TAKEN_MESSAGE =
  'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'
export const USERNAME_TAKEN_MESSAGE = 'Este nome de usuário já está em uso.'

export const authHandlers = [
  api.post(API_PATHS.register, async ({ request }) => {
    const body = await readBody(request, registerRequestSchema)
    if (findUserByEmail(body.email)) {
      throw new MockApiError('EMAIL_TAKEN', EMAIL_TAKEN_MESSAGE, {
        fields: { email: EMAIL_TAKEN_MESSAGE },
      })
    }
    if (findUserByUsername(body.username)) {
      throw new MockApiError('USERNAME_TAKEN', USERNAME_TAKEN_MESSAGE, {
        fields: { username: USERNAME_TAKEN_MESSAGE },
      })
    }

    const salt = createSalt()
    const passwordHash = await hashPassword(body.password, salt)
    const id = db.nextId('usr')
    const user = db.update((draft) => {
      draft.users[id] = {
        id,
        username: body.username,
        email: body.email,
        displayName: body.username,
        passwordSalt: salt,
        passwordHash,
        avatarUrl: null,
        ensName: '',
        walletNickname: '',
        profileVersion: 1,
        wallets: { principal: null, secundaria: null, secondaryIsPrincipal: false },
      }
      draft.favorites[id] = []
      return draft.users[id]
    })

    return HttpResponse.json({ session: createSession(id), user: toUserDto(user) }, { status: 201 })
  }),

  api.post(API_PATHS.login, async ({ request }) => {
    const body = await readBody(request, loginRequestSchema)
    const user = findUserByEmail(body.email)
    const valid =
      user && (await verifyPassword(body.password, user.passwordSalt, user.passwordHash))
    if (!user || !valid) {
      throw new MockApiError(
        'INVALID_CREDENTIALS',
        'E-mail ou senha incorretos. Confira e tente novamente.',
      )
    }
    return HttpResponse.json({ session: createSession(user.id), user: toUserDto(user) })
  }),

  api.get(API_PATHS.session, ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json({ user: toUserDto(user), expiresAt: sessionExpiresAt(request) })
  }),

  api.post(API_PATHS.logout, ({ request }) => {
    endSession(request)
    return new HttpResponse(null, { status: 204 })
  }),
]

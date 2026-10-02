import { HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  changePasswordRequestSchema,
  updateProfileRequestSchema,
  updateWalletsRequestSchema,
  walletInputSchema,
  walletSlotSchema,
  type WalletsDto,
} from '@/api/contracts/account'
import { API_PATHS } from '@/api/paths'
import { findUserByEmail, findUserByUsername, readBody, requireUser, toProfileDto } from '../auth'
import { db } from '../db/store'
import type { UserRecord } from '../db/types'
import { createSalt, hashPassword, verifyPassword } from '../password'
import { api, MockApiError } from '../respond'
import { USERNAME_TAKEN_MESSAGE } from './auth'

const EMAIL_IN_USE_MESSAGE = 'Este e-mail já pertence a outra conta.'

function updateUser(id: string, change: (user: UserRecord) => void) {
  return db.update((draft) => {
    const user = draft.users[id]
    if (!user) throw new MockApiError('UNAUTHENTICATED', 'Entre na sua conta para continuar.')
    change(user)
    return user
  })
}

const toWalletsDto = (user: UserRecord): WalletsDto => user.wallets

async function toDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

export const accountHandlers = [
  api.get(API_PATHS.profile, ({ request }) =>
    HttpResponse.json(toProfileDto(requireUser(request))),
  ),

  api.patch(API_PATHS.profile, async ({ request }) => {
    const current = requireUser(request)
    const body = await readBody(request, updateProfileRequestSchema)
    if (body.email && findUserByEmail(body.email, current.id)) {
      throw new MockApiError('EMAIL_TAKEN', EMAIL_IN_USE_MESSAGE, {
        fields: { email: EMAIL_IN_USE_MESSAGE },
      })
    }
    if (body.username && findUserByUsername(body.username, current.id)) {
      throw new MockApiError('USERNAME_TAKEN', USERNAME_TAKEN_MESSAGE, {
        fields: { username: USERNAME_TAKEN_MESSAGE },
      })
    }

    const user = updateUser(current.id, (draft) => {
      Object.assign(draft, body)
      draft.profileVersion += 1
    })
    return HttpResponse.json(toProfileDto(user))
  }),

  api.put(API_PATHS.avatar, async ({ request }) => {
    const current = requireUser(request)
    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) {
      throw new MockApiError('VALIDATION_ERROR', 'Envie uma imagem para o avatar.', {
        fields: { file: 'Envie uma imagem para o avatar.' },
      })
    }
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      const message = 'Formato não suportado. Envie uma imagem PNG, JPG ou WebP.'
      throw new MockApiError('VALIDATION_ERROR', message, { fields: { file: message } })
    }
    if (file.size > AVATAR_MAX_BYTES) {
      const message = 'A imagem passa de 5 MB. Escolha um arquivo menor.'
      throw new MockApiError('VALIDATION_ERROR', message, { fields: { file: message } })
    }

    const avatarUrl = await toDataUrl(file)
    updateUser(current.id, (draft) => {
      draft.avatarUrl = avatarUrl
      draft.profileVersion += 1
    })
    return HttpResponse.json({ avatarUrl })
  }),

  api.delete(API_PATHS.avatar, ({ request }) => {
    const current = requireUser(request)
    updateUser(current.id, (draft) => {
      draft.avatarUrl = null
      draft.profileVersion += 1
    })
    return new HttpResponse(null, { status: 204 })
  }),

  api.post(API_PATHS.password, async ({ request }) => {
    const current = requireUser(request)
    const body = await readBody(request, changePasswordRequestSchema)
    if (!(await verifyPassword(body.currentPassword, current.passwordSalt, current.passwordHash))) {
      const message = 'A senha atual está incorreta.'
      throw new MockApiError('INVALID_CURRENT_PASSWORD', message, {
        fields: { currentPassword: message },
      })
    }
    if (body.newPassword === body.currentPassword) {
      const message = 'A nova senha precisa ser diferente da atual.'
      throw new MockApiError('VALIDATION_ERROR', message, { fields: { newPassword: message } })
    }

    const salt = createSalt()
    const passwordHash = await hashPassword(body.newPassword, salt)
    updateUser(current.id, (draft) => {
      draft.passwordSalt = salt
      draft.passwordHash = passwordHash
    })
    return new HttpResponse(null, { status: 204 })
  }),

  api.get(API_PATHS.wallets, ({ request }) =>
    HttpResponse.json(toWalletsDto(requireUser(request))),
  ),

  api.put<{ slot: string }>(API_PATHS.wallet(), async ({ request, params }) => {
    const current = requireUser(request)
    const slot = walletSlotSchema.safeParse(params.slot)
    if (!slot.success) throw new MockApiError('NOT_FOUND', 'Carteira não encontrada.')
    const body = await readBody(request, walletInputSchema)

    const other = slot.data === 'principal' ? current.wallets.secundaria : current.wallets.principal
    if (other && other.address.toLowerCase() === body.address.toLowerCase()) {
      const message =
        slot.data === 'principal'
          ? 'Este endereço já está cadastrado como carteira secundária.'
          : 'Este endereço já é a carteira principal. Marque "Igual à carteira principal" para reutilizá-la.'
      throw new MockApiError('ADDRESS_IN_USE', message, { fields: { address: message } })
    }

    const user = updateUser(current.id, (draft) => {
      draft.wallets[slot.data] = body
    })
    return HttpResponse.json(toWalletsDto(user))
  }),

  api.patch(API_PATHS.wallets, async ({ request }) => {
    const current = requireUser(request)
    const body = await readBody(request, updateWalletsRequestSchema)
    if (body.secondaryIsPrincipal && !current.wallets.principal) {
      throw new MockApiError(
        'VALIDATION_ERROR',
        'Cadastre a carteira principal antes de reutilizá-la.',
      )
    }

    const user = updateUser(current.id, (draft) => {
      draft.wallets.secondaryIsPrincipal = body.secondaryIsPrincipal
    })
    return HttpResponse.json(toWalletsDto(user))
  }),
]

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest, apiSend } from '@/api/client'
import {
  avatarResponseSchema,
  profileSchema,
  walletsSchema,
  type ProfileDto,
  type WalletsDto,
} from '@/api/contracts/account'
import type { User } from '@/api/contracts/auth'
import { API_PATHS } from '@/api/paths'
import { toSubmitError } from '@/features/auth/api'
import { PRIVATE_QUERY_KEY, SESSION_QUERY_KEY } from '@/features/auth/session'
import type { ProfileValues, WalletValues } from './schemas'
import type { SaveResult, WalletSlot } from './types'

export const accountKeys = {
  profile: (userId: string) => [...PRIVATE_QUERY_KEY, userId, 'profile'] as const,
  wallets: (userId: string) => [...PRIVATE_QUERY_KEY, userId, 'wallets'] as const,
}

export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: accountKeys.profile(userId),
    queryFn: ({ signal }) => apiRequest(profileSchema, { url: API_PATHS.profile, signal }),
  })
}

export function walletsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: accountKeys.wallets(userId),
    queryFn: ({ signal }) => apiRequest(walletsSchema, { url: API_PATHS.wallets, signal }),
  })
}

const PROFILE_FIELDS = [
  'displayName',
  'username',
  'email',
  'ensName',
  'walletNickname',
  'currentPassword',
  'newPassword',
] as const

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob()
}

/**
 * Salva o perfil em até três passos (dados, avatar e senha), na ordem em que aparecem na tela.
 * Cada passo concluído já atualiza o cache, então uma falha no seguinte não desfaz o anterior.
 */
export function useSaveProfile(userId: string) {
  const queryClient = useQueryClient()

  const setProfile = (update: (profile: ProfileDto) => ProfileDto) => {
    const profile = queryClient.setQueryData<ProfileDto>(accountKeys.profile(userId), (current) =>
      current ? update(current) : current,
    )
    if (!profile) return
    queryClient.setQueryData<User | null>(SESSION_QUERY_KEY, (user) =>
      user
        ? {
            ...user,
            displayName: profile.displayName,
            username: profile.username,
            email: profile.email,
            avatarUrl: profile.avatarUrl,
          }
        : user,
    )
  }

  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatarUrl,
      previousAvatarUrl,
    }: {
      values: ProfileValues
      avatarUrl: string | null
      previousAvatarUrl: string | null
    }) => {
      const profile = await apiRequest(profileSchema, {
        method: 'PATCH',
        url: API_PATHS.profile,
        data: {
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName: values.ensName,
          walletNickname: values.walletNickname,
        },
      })
      setProfile(() => profile)

      if (avatarUrl !== previousAvatarUrl) {
        if (avatarUrl) {
          const form = new FormData()
          form.append('file', await dataUrlToBlob(avatarUrl), 'avatar.webp')
          const response = await apiRequest(avatarResponseSchema, {
            method: 'PUT',
            url: API_PATHS.avatar,
            data: form,
          })
          setProfile((current) => ({ ...current, avatarUrl: response.avatarUrl }))
        } else {
          await apiSend({ method: 'DELETE', url: API_PATHS.avatar })
          setProfile((current) => ({ ...current, avatarUrl: null }))
        }
      }

      if (values.newPassword) {
        await apiSend({
          method: 'POST',
          url: API_PATHS.password,
          data: { currentPassword: values.currentPassword, newPassword: values.newPassword },
        })
      }
    },
  })

  return async (
    values: ProfileValues,
    avatarUrl: string | undefined,
  ): Promise<SaveResult<keyof ProfileValues>> => {
    const previousAvatarUrl =
      queryClient.getQueryData<ProfileDto>(accountKeys.profile(userId))?.avatarUrl ?? null
    try {
      await mutation.mutateAsync({ values, avatarUrl: avatarUrl ?? null, previousAvatarUrl })
      return { ok: true }
    } catch (error) {
      return toSubmitError(error, PROFILE_FIELDS)
    }
  }
}

const WALLET_FIELDS = [
  'nickname',
  'displayName',
  'profileName',
  'network',
  'address',
  'secondaryWallet',
  'walletType',
  'referralCode',
  'email',
  'ensName',
] as const

export function useWalletMutations(userId: string) {
  const queryClient = useQueryClient()
  const setWallets = (wallets: WalletsDto) =>
    queryClient.setQueryData(accountKeys.wallets(userId), wallets)

  const saveMutation = useMutation({
    mutationFn: ({ slot, values }: { slot: WalletSlot; values: WalletValues }) =>
      apiRequest(walletsSchema, { method: 'PUT', url: API_PATHS.wallet(slot), data: values }),
    onSuccess: setWallets,
  })

  const sameMutation = useMutation({
    mutationFn: (secondaryIsPrincipal: boolean) =>
      apiRequest(walletsSchema, {
        method: 'PATCH',
        url: API_PATHS.wallets,
        data: { secondaryIsPrincipal },
      }),
    onSuccess: setWallets,
  })

  return {
    async saveWallet(
      slot: WalletSlot,
      values: WalletValues,
    ): Promise<SaveResult<keyof WalletValues>> {
      try {
        await saveMutation.mutateAsync({ slot, values })
        return { ok: true }
      } catch (error) {
        return toSubmitError(error, WALLET_FIELDS)
      }
    },

    async setSecondarySame(same: boolean): Promise<SaveResult> {
      try {
        await sameMutation.mutateAsync(same)
        return { ok: true }
      } catch (error) {
        return toSubmitError(error, [])
      }
    },
  }
}

import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { apiRequest, apiSend } from '@/api/client'
import { favoritesSchema } from '@/api/contracts/favorites'
import { isApiError } from '@/api/errors'
import { API_PATHS } from '@/api/paths'
import { PRIVATE_QUERY_KEY, isAuthError, useSessionUser } from '@/features/auth/session'
import { toNftSummary } from '@/features/catalog/api'
import type { NftSummary } from '@/features/catalog/types'
import { announce } from '@/lib/announce'

const EMPTY_IDS: ReadonlySet<string> = new Set()

export const favoritesKey = (userId: string) => [...PRIVATE_QUERY_KEY, userId, 'favorites'] as const

/** Favoritos já no formato das telas, mais recentes primeiro. */
export function favoritesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: async ({ signal }) => {
      const { items } = await apiRequest(favoritesSchema, { url: API_PATHS.favorites, signal })
      return items.map(toNftSummary)
    },
  })
}

/** Ids favoritados da conta atual; visitante não tem favoritos. */
export function useFavoriteIds(): ReadonlySet<string> {
  const user = useSessionUser()
  const { data } = useQuery({
    ...favoritesQueryOptions(user?.id ?? ''),
    enabled: Boolean(user),
  })
  return useMemo(() => (data ? new Set(data.map((nft) => nft.id)) : EMPTY_IDS), [data])
}

type ToggleVariables = { nft: NftSummary; favorite: boolean }

/**
 * Favoritar com atualização otimista: o coração muda na hora e, se a API recusar, a lista volta
 * ao estado anterior com aviso visível e anunciado. Visitante é convidado a entrar.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const user = useSessionUser()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const key = favoritesKey(user?.id ?? '')

  const mutation = useMutation({
    mutationKey: ['favorites', 'toggle'],
    mutationFn: ({ nft, favorite }: ToggleVariables) =>
      apiSend({ method: favorite ? 'PUT' : 'DELETE', url: API_PATHS.favorite(nft.id) }),
    onMutate: async ({ nft, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NftSummary[]>(key)
      queryClient.setQueryData<NftSummary[]>(key, (items = []) =>
        favorite
          ? [nft, ...items.filter((item) => item.id !== nft.id)]
          : items.filter((item) => item.id !== nft.id),
      )
      return { previous }
    },
    onSuccess: (_data, { nft, favorite }) => {
      announce(`${nft.name} ${favorite ? 'adicionado aos' : 'removido dos'} favoritos`)
    },
    onError: (error, { nft, favorite }, context) => {
      // Sem lista anterior no cache não há o que restaurar: descarta a otimista e busca de novo.
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      else void queryClient.resetQueries({ queryKey: key })
      if (isAuthError(error)) return
      notifyFailure(nft, favorite, error)
    },
    // Só sincroniza com a API quando não há outro clique em andamento, para não desfazer a tela.
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: ['favorites', 'toggle'] }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key })
      }
    },
  })

  return (nft: NftSummary) => {
    if (!user) {
      toast.info('Entre na sua conta para salvar favoritos.', {
        action: {
          label: 'Entrar',
          onClick: () => void navigate({ to: '/entrar', search: { redirect: href } }),
        },
      })
      return
    }
    // O clique só decide entre favoritar e remover depois de conhecer a lista atual.
    void queryClient
      .ensureQueryData(favoritesQueryOptions(user.id))
      .then((items) => {
        mutation.mutate({ nft, favorite: !items.some((item) => item.id === nft.id) })
      })
      .catch((error: unknown) => {
        if (!isAuthError(error))
          notifyFailure(nft, !favoriteIdsOf(queryClient, key).has(nft.id), error)
      })
  }
}

function favoriteIdsOf(queryClient: ReturnType<typeof useQueryClient>, key: readonly unknown[]) {
  return new Set(queryClient.getQueryData<NftSummary[]>(key)?.map((item) => item.id))
}

function notifyFailure(nft: NftSummary, favorite: boolean, error: unknown) {
  const message = isApiError(error, 'NOT_FOUND')
    ? 'Este NFT não está mais disponível.'
    : `Não foi possível ${favorite ? 'favoritar' : 'remover dos favoritos'} ${nft.name}. Tente novamente.`
  toast.error(message)
  announce(message, 'assertive')
}

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import type { AxiosRequestConfig } from 'axios'
import { apiRequest } from '@/api/client'
import {
  cartSchema,
  mergeCartResponseSchema,
  type CartDto,
  type MergeCartResponse,
} from '@/api/contracts/cart'
import { isApiError } from '@/api/errors'
import { API_PATHS } from '@/api/paths'
import type { User } from '@/api/contracts/auth'
import {
  PRIVATE_QUERY_KEY,
  SESSION_QUERY_KEY,
  isAuthError,
  useSessionUser,
} from '@/features/auth/session'
import type { EditionId } from '@/features/nft/types'
import { announce } from '@/lib/announce'
import {
  clearGuestCartId,
  ensureGuestCartId,
  getGuestCartId,
  subscribeGuestCart,
} from './guest-cart'
import type { AppliedCoupon, CartLine, CartTotals, CouponResult } from './types'

export type Cart = {
  version: number
  lines: CartLine[]
  totals: CartTotals
  coupon?: AppliedCoupon
  /** Unidades no carrinho, para o contador do cabeçalho. */
  count: number
}

const EMPTY_TOTALS: CartTotals = {
  subtotalEth: '0',
  discountEth: '0',
  networkFeeEth: '0',
  totalEth: '0',
}

export const EMPTY_CART: Cart = { version: 0, lines: [], totals: EMPTY_TOTALS, count: 0 }

const GUEST_CART_KEY = ['cart', 'guest'] as const

// As mudanças no carrinho vão para a API uma de cada vez, na ordem dos cliques: quantidades
// absolutas enviadas fora de ordem poderiam gravar um valor antigo por cima do mais novo.
const CART_SCOPE = { id: 'cart' }
const CART_MUTATION_KEY = ['cart', 'mutation'] as const

/** Carrinho da conta fica junto dos dados privados; o do visitante, pelo id dele. */
export const cartKey = (userId: string | null, guestId: string | null) =>
  userId
    ? ([...PRIVATE_QUERY_KEY, userId, 'cart'] as const)
    : ([...GUEST_CART_KEY, guestId] as const)

function toCart(dto: CartDto): Cart {
  return {
    version: dto.version,
    lines: dto.lines.map((line) => ({
      id: line.id,
      nftId: line.nftId,
      name: line.name,
      artwork: line.artwork,
      tokenId: line.tokenId,
      edition: line.edition,
      unitPriceEth: line.unitPriceEth,
      quantity: line.quantity,
      maxQuantity: line.maxQuantity,
      status: line.status ?? undefined,
    })),
    totals: dto.totals,
    coupon: dto.coupon ?? undefined,
    count: dto.lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

function useCartKey() {
  const user = useSessionUser()
  const guestId = useSyncExternalStore(subscribeGuestCart, getGuestCartId)
  return { key: cartKey(user?.id ?? null, guestId), hasCart: Boolean(user || guestId) }
}

export function cartQueryOptions(key: readonly unknown[]) {
  return queryOptions({
    queryKey: key,
    queryFn: ({ signal }) => apiRequest(cartSchema, { url: API_PATHS.cart, signal }),
    select: toCart,
  })
}

/** Carrinho atual. Visitante que ainda não adicionou nada nem chega a consultar a API. */
export function useCart() {
  const { key, hasCart } = useCartKey()
  const query = useQuery({ ...cartQueryOptions(key), enabled: hasCart })
  return {
    ...query,
    cart: hasCart ? query.data : EMPTY_CART,
    isPending: hasCart && query.isPending,
  }
}

/**
 * Guarda a resposta só se ela for mais nova que o carrinho em cache: com várias mudanças seguidas,
 * uma resposta atrasada (versão menor) não desfaz a mais recente.
 */
function storeCart(queryClient: QueryClient, key: readonly unknown[], cart: CartDto) {
  queryClient.setQueryData<CartDto>(key, (current) =>
    !current || cart.version >= current.version ? cart : current,
  )
}

/**
 * Resposta de uma mudança do carrinho. Enquanto outras mudanças esperam na fila, a tela fica com
 * o valor otimista mais recente; só a última resposta grava, já com todas aplicadas.
 */
function storeLatestCart(queryClient: QueryClient, key: readonly unknown[], cart: CartDto) {
  if (queryClient.isMutating({ mutationKey: CART_MUTATION_KEY }) > 1) return
  storeCart(queryClient, key, cart)
}

function editLines(
  queryClient: QueryClient,
  key: readonly unknown[],
  edit: (lines: CartDto['lines']) => CartDto['lines'],
) {
  queryClient.setQueryData<CartDto>(key, (current) =>
    current ? { ...current, lines: edit(current.lines) } : current,
  )
}

const errorMessage = (error: unknown, fallback: string) =>
  isApiError(error) && !error.retryable ? error.message : fallback

/** Mutations do carrinho; todas recebem o carrinho inteiro, já recalculado pela API. */
export function useCartActions() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()

  const request = (config: AxiosRequestConfig) => apiRequest(cartSchema, config)
  const settle = {
    onSuccess: (cart: CartDto) => storeLatestCart(queryClient, key, cart),
  }
  // Em erro, a verdade volta da API em vez de um retrato que pode já estar velho.
  const recover = (error: unknown, fallback: string) => {
    void queryClient.invalidateQueries({ queryKey: key })
    if (isAuthError(error)) return
    const message = errorMessage(error, fallback)
    toast.error(message)
    announce(message, 'assertive')
  }

  const add = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: async (input: { nftId: string; editionId: EditionId; quantity: number }) => {
      if (!queryClient.getQueryData<User | null>(SESSION_QUERY_KEY)) ensureGuestCartId()
      return request({ method: 'POST', url: API_PATHS.cartItems, data: input })
    },
    onSuccess: (cart) => {
      // O id do visitante pode ter acabado de nascer: grava no carrinho certo.
      const user = queryClient.getQueryData<User | null>(SESSION_QUERY_KEY)
      storeLatestCart(queryClient, cartKey(user?.id ?? null, getGuestCartId()), cart)
    },
  })

  const setQuantity = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: ({ line, quantity }: { line: CartLine; quantity: number }) =>
      request({ method: 'PATCH', url: API_PATHS.cartItem(line.id), data: { quantity } }),
    onMutate: async ({ line, quantity }) => {
      await queryClient.cancelQueries({ queryKey: key })
      editLines(queryClient, key, (lines) =>
        lines.map((item) => (item.id === line.id ? { ...item, quantity } : item)),
      )
    },
    ...settle,
    onError: (error, { line }) =>
      recover(error, `Não foi possível alterar a quantidade de ${line.name}. Tente novamente.`),
  })

  const remove = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: (line: CartLine) => request({ method: 'DELETE', url: API_PATHS.cartItem(line.id) }),
    onMutate: async (line) => {
      await queryClient.cancelQueries({ queryKey: key })
      editLines(queryClient, key, (lines) => lines.filter((item) => item.id !== line.id))
    },
    onSuccess: (cart, line) => {
      storeLatestCart(queryClient, key, cart)
      announce(`${line.name} removido do carrinho`)
    },
    onError: (error, line) =>
      recover(error, `Não foi possível remover ${line.name}. Tente novamente.`),
  })

  const acceptPrices = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: async (lines: CartLine[]) => {
      let cart: CartDto | undefined
      for (const line of lines) {
        cart = await request({
          method: 'PATCH',
          url: API_PATHS.cartItem(line.id),
          data: { acceptPrice: true },
        })
      }
      return cart
    },
    onSuccess: (cart) => {
      if (cart) storeLatestCart(queryClient, key, cart)
      announce('Novos preços confirmados')
    },
    onError: (error) => recover(error, 'Não foi possível confirmar os novos preços.'),
  })

  const applyCoupon = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: (code: string) =>
      request({ method: 'PUT', url: API_PATHS.cartCoupon, data: { code } }),
    ...settle,
  })

  const removeCoupon = useMutation({
    mutationKey: CART_MUTATION_KEY,
    scope: CART_SCOPE,
    mutationFn: () => request({ method: 'DELETE', url: API_PATHS.cartCoupon }),
    ...settle,
    onError: (error) => recover(error, 'Não foi possível remover o cupom. Tente novamente.'),
  })

  return {
    /** Lança o ApiError (ex.: AVAILABILITY_CONFLICT) para a tela decidir a mensagem. */
    add: add.mutateAsync,
    setQuantity: (line: CartLine, quantity: number) => setQuantity.mutate({ line, quantity }),
    remove: (line: CartLine) => remove.mutate(line),
    acceptPrices: (lines: CartLine[]) => acceptPrices.mutate(lines),
    removeCoupon: () => removeCoupon.mutate(),
    async applyCoupon(code: string): Promise<CouponResult> {
      try {
        await applyCoupon.mutateAsync(code)
        announce('Cupom aplicado')
        return { ok: true }
      } catch (error) {
        const message = isApiError(error)
          ? (error.fields?.code ?? error.message)
          : 'Não foi possível aplicar o cupom.'
        return { ok: false, message }
      }
    },
  }
}

function adjustmentMessage(cart: CartDto, adjustments: MergeCartResponse['adjustments']) {
  const names = adjustments.map((item) => {
    const line = cart.lines.find(
      (candidate) => candidate.nftId === item.nftId && candidate.edition.id === item.editionId,
    )
    return `${line?.name ?? item.nftId}: ${item.kept} de ${item.requested}`
  })
  return `Ajustamos as quantidades ao disponível — ${names.join('; ')}.`
}

/**
 * Junta o carrinho do visitante ao da conta logo depois de entrar. Falhar aqui não impede o login:
 * o carrinho do visitante continua guardado e a pessoa é avisada.
 */
export async function mergeGuestCart(queryClient: QueryClient, userId: string) {
  const guestCartId = getGuestCartId()
  if (!guestCartId) return
  try {
    const { cart, adjustments } = await apiRequest(mergeCartResponseSchema, {
      method: 'POST',
      url: API_PATHS.cartMerge,
      data: { guestCartId },
    })
    queryClient.setQueryData(cartKey(userId, null), cart)
    queryClient.removeQueries({ queryKey: GUEST_CART_KEY })
    clearGuestCartId()
    if (adjustments.length > 0) toast.warning(adjustmentMessage(cart, adjustments))
  } catch {
    toast.error('Não foi possível juntar o carrinho de visitante à sua conta.')
  }
}

/**
 * Tira do carrinho da conta o que foi comprado (e o cupom usado). Temporário: no 4e quem faz
 * isso é a API, ao confirmar o pedido.
 */
export async function removePurchased(
  queryClient: QueryClient,
  userId: string,
  items: { id: string; quantity: number }[],
) {
  const key = cartKey(userId, null)
  const current = await queryClient.fetchQuery(cartQueryOptions(key))
  for (const item of items) {
    const line = current.lines.find((candidate) => candidate.id === item.id)
    if (!line) continue
    const remaining = line.quantity - item.quantity
    const cart = await apiRequest(
      cartSchema,
      remaining > 0
        ? { method: 'PATCH', url: API_PATHS.cartItem(line.id), data: { quantity: remaining } }
        : { method: 'DELETE', url: API_PATHS.cartItem(line.id) },
    )
    storeCart(queryClient, key, cart)
  }
  if (current.coupon) {
    storeCart(
      queryClient,
      key,
      await apiRequest(cartSchema, { method: 'DELETE', url: API_PATHS.cartCoupon }),
    )
  }
}

import type { QueryClient } from '@tanstack/react-query'
import { io, type Socket } from 'socket.io-client'
import type { User } from '@/api/contracts/auth'
import type { CartDto } from '@/api/contracts/cart'
import {
  nftUpdatedEventSchema,
  orderUpdatedEventSchema,
  walletDisconnectedEventSchema,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
  type RealtimeEvent,
} from '@/api/contracts/events'
import type { NftSummaryDto } from '@/api/contracts/nfts'
import type { OrderDto } from '@/api/contracts/orders'
import { SOCKET_PATH, SOCKET_URL } from '@/api/paths'
import { SESSION_QUERY_KEY } from '@/features/auth/session'
import { sessionStore } from '@/features/auth/session-store'
import { catalogKeys } from '@/features/catalog/api'
import { formatEth } from '@/features/catalog/format'
import { orderKeys } from '@/features/orders/api'
import { notifyWalletDisconnected, setRealtimeStatus } from '@/features/realtime/status'
import { announce } from '@/lib/announce'

/** Quantos `eventId` já vistos ficam guardados para descartar repetições. */
const SEEN_LIMIT = 500
const CONNECT_TIMEOUT_MS = 5_000

const isCartQuery = (key: readonly unknown[]) => key.includes('cart')

/**
 * Descarta eventos repetidos (mesmo `eventId`) e antigos (versão menor ou igual à última
 * aplicada do mesmo recurso), que podem chegar fora de ordem.
 */
function createEventLedger() {
  const seen = new Set<string>()
  const versions = new Map<string, number>()
  return {
    accept(event: RealtimeEvent) {
      if (seen.has(event.eventId)) return false
      seen.add(event.eventId)
      if (seen.size > SEEN_LIMIT) seen.delete(seen.values().next().value!)
      const key = `${event.resource.type}:${event.resource.id}`
      if (event.version <= (versions.get(key) ?? 0)) return false
      versions.set(key, event.version)
      return true
    },
  }
}

/** Nome e preço que esta tela conhece do NFT (carrinho ou detalhe em cache), para o aviso. */
function knownNft(queryClient: QueryClient, id: string) {
  const detail = queryClient.getQueryData<NftSummaryDto>(catalogKeys.detail(id))
  if (detail) return { name: detail.name, priceEth: detail.priceEth, version: detail.version }
  for (const [, cart] of queryClient.getQueriesData<CartDto>({
    predicate: (query) => isCartQuery(query.queryKey),
  })) {
    const line = cart?.lines.find((item) => item.nftId === id)
    if (line) return { name: line.name, priceEth: line.unitPriceEth, version: 0 }
  }
  return null
}

function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent) {
  const known = knownNft(queryClient, event.resource.id)
  if (known && known.version >= event.version) return

  void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  void queryClient.invalidateQueries({ predicate: (query) => isCartQuery(query.queryKey) })
  if (!known) return
  announce(
    known.priceEth === event.data.priceEth
      ? `A disponibilidade de ${known.name} foi atualizada.`
      : `O preço de ${known.name} mudou para ${formatEth(event.data.priceEth)}.`,
  )
}

function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent, userId: string) {
  const key = orderKeys.detail(userId, event.resource.id)
  const state = queryClient.getQueryState<OrderDto>(key)
  if (!state?.data || state.fetchStatus === 'fetching') {
    // Uma leitura em andamento pode ter saído antes da mudança: busca de novo em vez de gravar
    // por cima de um cache vazio que a resposta antiga ocuparia depois.
    void queryClient.invalidateQueries({ queryKey: key })
  } else {
    queryClient.setQueryData<OrderDto>(key, (order) => {
      // Confirmado e recusado são finais: um evento antigo não faz o pedido voltar a pendente.
      if (!order || order.version >= event.version || order.status !== 'pending') return order
      return { ...order, ...event.data, version: event.version }
    })
  }
  void queryClient.invalidateQueries({ queryKey: orderKeys.pending(userId) })
  if (event.data.status === 'confirmed') {
    void queryClient.invalidateQueries({ predicate: (query) => isCartQuery(query.queryKey) })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  }
}

/**
 * Mantém um socket por sessão: visitante conecta sem token (só eventos públicos) e, ao entrar,
 * sair ou trocar de conta, o socket é recriado. Eventos de um socket anterior são descartados.
 */
export function installRealtime(queryClient: QueryClient) {
  let socket: Socket | null = null

  const setStatus = (next: 'connected' | 'disconnected') => {
    setRealtimeStatus(next)
    // A consulta periódica dos pedidos depende do status: as consultas reavaliam o intervalo.
    void queryClient.invalidateQueries({
      predicate: (query) => query.queryKey.includes('orders'),
    })
  }

  function open() {
    const token = sessionStore.getToken()
    const ledger = createEventLedger()
    const current = io(SOCKET_URL, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      // Sem resposta ao handshake em 5 s, a tentativa é abandonada e outra começa.
      timeout: CONNECT_TIMEOUT_MS,
      auth: token ? { token } : {},
    })
    socket = current
    const isCurrent = () => socket === current
    const userId = () => queryClient.getQueryData<User | null>(SESSION_QUERY_KEY)?.id ?? null

    current.on('connect', () => isCurrent() && setStatus('connected'))
    current.on('disconnect', () => isCurrent() && setStatus('disconnected'))
    // Eventos perdidos enquanto a conexão esteve fora: as telas abertas buscam o estado atual.
    current.io.on('reconnect', () => {
      if (isCurrent()) void queryClient.invalidateQueries()
    })

    current.on('nft.updated', (payload: unknown) => {
      const parsed = nftUpdatedEventSchema.safeParse(payload)
      if (isCurrent() && parsed.success && ledger.accept(parsed.data)) {
        applyNftUpdated(queryClient, parsed.data)
      }
    })
    current.on('order.updated', (payload: unknown) => {
      const parsed = orderUpdatedEventSchema.safeParse(payload)
      const owner = userId()
      if (isCurrent() && owner && parsed.success && ledger.accept(parsed.data)) {
        applyOrderUpdated(queryClient, parsed.data, owner)
      }
    })
    current.on('wallet.disconnected', (payload: unknown) => {
      const parsed = walletDisconnectedEventSchema.safeParse(payload)
      if (isCurrent() && parsed.success && ledger.accept(parsed.data)) {
        notifyWalletDisconnected(parsed.data.resource.id)
      }
    })
  }

  open()
  return sessionStore.subscribe(() => {
    const previous = socket
    socket = null
    previous?.disconnect()
    setRealtimeStatus('connecting')
    open()
  })
}

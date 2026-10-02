import { queryOptions } from '@tanstack/react-query'
import { apiRequest } from '@/api/client'
import { orderListSchema, orderSchema, type OrderDto } from '@/api/contracts/orders'
import { API_PATHS } from '@/api/paths'
import { PRIVATE_QUERY_KEY } from '@/features/auth/session'
import { isRealtimeConnected } from '@/features/realtime/status'
import type { Order } from './types'

/** Sem o socket, enquanto o pedido está pendente, a tela consulta a API neste intervalo. */
const PENDING_POLL_MS = 1_500

export const orderKeys = {
  all: (userId: string) => [...PRIVATE_QUERY_KEY, userId, 'orders'] as const,
  detail: (userId: string, id: string) => [...orderKeys.all(userId), id] as const,
  pending: (userId: string) => [...orderKeys.all(userId), 'pending'] as const,
}

export function toOrder(dto: OrderDto): Order {
  return {
    id: dto.id,
    status: dto.status,
    createdAt: dto.createdAt,
    transactionHash: dto.transactionHash ?? '',
    network: dto.network,
    provider: dto.provider,
    walletAddress: dto.walletAddress,
    totals: dto.totals,
    lines: dto.lines.map((line) => ({
      id: line.lineId,
      name: line.name,
      artwork: line.artwork,
      tokenId: line.tokenId,
      editionLabel: line.editionLabel,
      quantity: line.quantity,
      unitPriceEth: line.unitPriceEth,
      subtotalEth: line.subtotalEth,
    })),
    failureReason: dto.failureReason ?? undefined,
  }
}

export function orderQueryOptions(userId: string, id: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, id),
    queryFn: ({ signal }) => apiRequest(orderSchema, { url: API_PATHS.order(id), signal }),
    select: toOrder,
    // Pendente é o único estado que ainda muda; com o socket conectado, a mudança chega pelo
    // evento `order.updated` e a consulta periódica fica só como reserva para quando ele cair.
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !isRealtimeConnected() ? PENDING_POLL_MS : false,
  })
}

/** Pedidos ainda pendentes, para retomar um pagamento interrompido (ex.: página recarregada). */
export function pendingOrdersQueryOptions(userId: string) {
  return queryOptions({
    queryKey: orderKeys.pending(userId),
    queryFn: ({ signal }) =>
      apiRequest(orderListSchema, {
        url: API_PATHS.myOrders,
        params: { status: 'pending' },
        signal,
      }),
    select: (data) => data.items.map(toOrder),
  })
}

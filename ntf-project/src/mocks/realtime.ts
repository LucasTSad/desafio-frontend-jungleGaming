import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type {
  NftUpdatedEvent,
  OrderUpdatedEvent,
  RealtimeEvent,
  WalletDisconnectedEvent,
} from '@/api/contracts/events'
import type { EditionIdDto } from '@/api/contracts/nfts'
import { SOCKET_PATH, SOCKET_URL } from '@/api/paths'
import { scheduleSettlement } from './checkout'
import { db, mockClock } from './db/store'
import type { DbState } from './db/types'
import { isScenario } from './scenarios'

/** Menor que o `pingInterval` anunciado pelo binding (25 s): sem ping, o cliente derruba a conexão. */
const PING_EVERY_MS = 20_000
/** No cenário "eventos-duplicados", quanto depois chegam a repetição e o evento antigo. */
const DUPLICATE_DELAY_MS = 150

type Client = {
  send: (event: RealtimeEvent) => void
  close: () => void
  userId: string | null
}

const clients = new Set<Client>()
let online = true
const lastSent = new Map<string, RealtimeEvent>()

// O MSW tira o "/socket.io/" do caminho antes de comparar, então o link é a própria origem; o
// caminho original é conferido na conexão, e o que não for Socket.IO (ex.: HMR do Vite) segue direto.
const socketLink = ws.link(SOCKET_URL.replace(/^http/, 'ws'))

/** O pacote CONNECT do Socket.IO ("40" + JSON) traz o `auth` enviado pelo cliente. */
function userFromConnectPacket(data: string) {
  try {
    const auth = JSON.parse(data.slice(2) || '{}') as { token?: unknown }
    if (typeof auth.token !== 'string') return null
    const session = db.get().sessions[auth.token]
    return session && Date.parse(session.expiresAt) > mockClock.now() ? session.userId : null
  } catch {
    return null
  }
}

export const realtimeHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    if (!connection.client.url.pathname.startsWith(SOCKET_PATH)) {
      connection.server.connect()
      return
    }
    // Fora do ar, o servidor não responde ao handshake: o cliente desiste pelo próprio timeout e
    // tenta de novo. (Recusar fechando a conexão não serve: o Socket.IO só reage a erro nessa fase.)
    if (!online) return
    const io = toSocketIo(connection)
    const client: Client = {
      send: (event) => io.client.emit(event.type, event),
      close: () => connection.client.close(),
      userId: null,
    }
    connection.client.addEventListener('message', (event) => {
      if (typeof event.data === 'string' && event.data.startsWith('40')) {
        client.userId = userFromConnectPacket(event.data)
      }
    })
    const ping = setInterval(() => connection.client.send('2'), PING_EVERY_MS)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      clients.delete(client)
    })
    clients.add(client)
  }),
]

function deliver(event: RealtimeEvent, ownerId: string | null) {
  for (const client of clients) {
    if (ownerId === null || client.userId === ownerId) client.send(event)
  }
}

/**
 * Entrega o evento a todos (`ownerId` nulo) ou só às conexões do dono. Em "eventos-duplicados",
 * o mesmo evento chega de novo e o anterior do mesmo recurso chega depois dele, fora de ordem.
 */
function publish(event: RealtimeEvent, ownerId: string | null) {
  const resourceKey = `${event.resource.type}:${event.resource.id}`
  const previous = lastSent.get(resourceKey)
  lastSent.set(resourceKey, event)
  deliver(event, ownerId)
  if (isScenario('eventos-duplicados')) {
    setTimeout(() => {
      deliver(event, ownerId)
      if (previous) deliver(previous, ownerId)
    }, DUPLICATE_DELAY_MS)
  }
}

function envelope<T extends RealtimeEvent>(
  type: T['type'],
  resource: T['resource'],
  version: number,
  data: T['data'],
) {
  return {
    eventId: `${type}:${resource.id}:${version}`,
    type,
    resource,
    version,
    occurredAt: mockClock.iso(),
    data,
  } as T
}

/** Compara o banco antes e depois de cada gravação e publica o evento de cada mudança. */
function publishChanges(before: DbState, after: DbState) {
  for (const [id, nft] of Object.entries(after.nfts)) {
    if (nft.version <= (before.nfts[id]?.version ?? 0)) continue
    const editions = Object.entries(nft.editions).map(([edition, available]) => ({
      id: edition as EditionIdDto,
      available,
    }))
    publish(
      envelope<NftUpdatedEvent>('nft.updated', { type: 'nft', id }, nft.version, {
        priceEth: nft.priceEth,
        previousPriceEth: nft.previousPriceEth,
        editions,
      }),
      null,
    )
  }

  for (const [id, order] of Object.entries(after.orders)) {
    const previous = before.orders[id]
    if (!previous || order.version <= previous.version || order.status === previous.status) {
      continue
    }
    publish(
      envelope<OrderUpdatedEvent>('order.updated', { type: 'order', id }, order.version, {
        status: order.status,
        transactionHash: order.transactionHash,
        failureReason: order.failureReason,
      }),
      order.userId,
    )
  }

  for (const [id, connection] of Object.entries(after.walletConnections)) {
    if (!connection.disconnectedReason || before.walletConnections[id]?.disconnectedReason) continue
    publish(
      envelope<WalletDisconnectedEvent>(
        'wallet.disconnected',
        { type: 'wallet-connection', id },
        1,
        { reason: connection.disconnectedReason },
      ),
      connection.userId,
    )
  }
}

/** Liga o "servidor" de eventos ao banco mock e retoma os pedidos que ficaram pendentes. */
export function startRealtime() {
  let previous = db.get()
  db.subscribe((next) => {
    const before = previous
    previous = next
    publishChanges(before, next)
  })
  for (const order of Object.values(db.get().orders)) scheduleSettlement(order.id)
}

export const realtimeControl = {
  /** Conexões abertas nesta aba (inclusive as de visitante, sem token). */
  connections() {
    return clients.size
  },

  /** Dono de cada conexão aberta (`null` para visitante), para conferir a troca de sessão. */
  connectionUsers() {
    return [...clients].map((client) => client.userId)
  },

  /** Derruba as conexões e recusa novas enquanto `online` for falso. */
  setOnline(value: boolean) {
    online = value
    if (!value) for (const client of [...clients]) client.close()
  },

  /** Simula a carteira encerrando as conexões abertas (ex.: bloqueio ou troca de conta nela). */
  disconnectWallets(reason = 'A carteira encerrou a conexão.') {
    db.update((draft) => {
      for (const connection of Object.values(draft.walletConnections)) {
        if (connection.disconnectedReason) continue
        connection.disconnectedReason = reason
        connection.expiresAt = mockClock.iso()
      }
    })
  },
}

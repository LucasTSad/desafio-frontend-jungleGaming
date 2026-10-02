type Status = 'connecting' | 'connected' | 'disconnected'
type WalletListener = (connectionId: string) => void

let status: Status = 'connecting'
const walletListeners = new Set<WalletListener>()

/** Com o socket conectado, as telas dispensam a consulta periódica e esperam o evento. */
export function isRealtimeConnected() {
  return status === 'connected'
}

export function setRealtimeStatus(next: Status) {
  status = next
}

export function onWalletDisconnected(listener: WalletListener) {
  walletListeners.add(listener)
  return () => {
    walletListeners.delete(listener)
  }
}

export function notifyWalletDisconnected(connectionId: string) {
  for (const listener of walletListeners) listener(connectionId)
}

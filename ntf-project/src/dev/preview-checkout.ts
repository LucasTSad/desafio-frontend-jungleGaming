// Checkout e pedidos de exemplo, temporários até a integração com a API (MSW) e o Socket.IO.
// Os pedidos ficam no sessionStorage só para a demonstração sobreviver a um refresh.

import { useSyncExternalStore } from 'react'
import type {
  CheckoutNetwork,
  CheckoutQuote,
  PaymentResult,
  PaymentStep,
  WalletProvider,
} from '@/features/checkout/types'
import type { Order } from '@/features/orders/types'
import { previewCartActions } from './preview-cart'

/**
 * Troque para revisar os outros caminhos do pagamento:
 * - 'wallet-rejected': a primeira conexão com a carteira é recusada;
 * - 'quote-changed': a taxa de rede muda na primeira revalidação e exige nova confirmação;
 * - 'payment-refused': o pedido é criado, mas a rede recusa o pagamento.
 */
export const previewCheckoutScenario:
  'success' | 'wallet-rejected' | 'quote-changed' | 'payment-refused' = 'success'

const STORAGE_KEY = 'kurio-preview-orders'
const CONFIRMATION_DELAY = 3500
const latency = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const round = (value: number) => Math.round(value * 1e6) / 1e6
const randomHex = (length: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(length / 2)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')

let orders: Record<string, Order> = readStoredOrders()
const ordersByKey = new Map<string, string>()
const listeners = new Set<() => void>()
let walletRejected = false
let quoteChanged = false

function readStoredOrders(): Record<string, Order> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, Order>
  } catch {
    return {}
  }
}

function setOrders(next: Record<string, Order>) {
  orders = next
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // Sem storage disponível, o pedido continua em memória.
  }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function scheduleResolution(orderId: string) {
  setTimeout(() => {
    const order = orders[orderId]
    if (!order || order.status !== 'pending') return
    const refused = previewCheckoutScenario === 'payment-refused'
    setOrders({
      ...orders,
      [orderId]: refused
        ? {
            ...order,
            status: 'refused',
            failureReason: 'A carteira informou saldo insuficiente para cobrir o total e a taxa.',
          }
        : { ...order, status: 'confirmed' },
    })
    if (!refused) {
      previewCartActions.removePurchased(
        order.lines.map((line) => ({ id: line.id, quantity: line.quantity })),
      )
    }
  }, CONFIRMATION_DELAY)
}

for (const order of Object.values(orders)) {
  if (order.status === 'pending') scheduleResolution(order.id)
}

export function usePreviewOrder(orderId: string) {
  return useSyncExternalStore(subscribe, () => orders[orderId])
}

type PayInput = {
  idempotencyKey: string
  quote: CheckoutQuote
  network: CheckoutNetwork
  provider: WalletProvider
  walletAddress: string
  onStep: (step: PaymentStep) => void
}

export async function previewPay(input: PayInput): Promise<PaymentResult> {
  const existing = ordersByKey.get(input.idempotencyKey)
  if (existing) return { kind: 'placed', orderId: existing }

  input.onStep('connecting')
  await latency(900)
  if (previewCheckoutScenario === 'wallet-rejected' && !walletRejected) {
    walletRejected = true
    return {
      kind: 'wallet-rejected',
      message:
        'A conexão foi recusada na carteira. Aprove a solicitação ou escolha outra carteira.',
    }
  }

  input.onStep('quoting')
  await latency(700)
  if (previewCheckoutScenario === 'quote-changed' && !quoteChanged) {
    quoteChanged = true
    const networkFeeEth = 0.021
    const { totals } = input.quote
    return {
      kind: 'quote-changed',
      message: 'A taxa de rede subiu de 0.016 ETH para 0.021 ETH desde a sua revisão.',
      quote: {
        lines: input.quote.lines,
        totals: {
          ...totals,
          networkFeeEth,
          totalEth: round(totals.subtotalEth - totals.discountEth + networkFeeEth),
        },
      },
    }
  }

  input.onStep('signing')
  await latency(1000)
  const id = randomHex(8)
  const order: Order = {
    id,
    status: 'pending',
    createdAt: new Date().toISOString(),
    transactionHash: `0x${randomHex(64)}`,
    network: input.network,
    provider: input.provider,
    walletAddress: input.walletAddress,
    totals: input.quote.totals,
    lines: input.quote.lines.map((line) => ({
      id: line.id,
      name: line.name,
      artwork: line.artwork,
      tokenId: line.tokenId,
      editionLabel: line.edition.label,
      quantity: line.quantity,
      unitPriceEth: line.unitPriceEth,
      subtotalEth: round(line.unitPriceEth * line.quantity),
    })),
  }
  ordersByKey.set(input.idempotencyKey, id)
  setOrders({ ...orders, [id]: order })
  scheduleResolution(id)
  return { kind: 'placed', orderId: id }
}

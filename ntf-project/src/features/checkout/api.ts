import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/api/client'
import {
  quoteSchema,
  walletConnectionSchema,
  type QuoteDto,
  type WalletConnectionDto,
} from '@/api/contracts/checkout'
import { IDEMPOTENCY_HEADER, orderSchema, type OrderDto } from '@/api/contracts/orders'
import { isApiError } from '@/api/errors'
import { API_PATHS } from '@/api/paths'
import { formatEth } from '@/features/catalog/format'
import { onWalletDisconnected } from '@/features/realtime/status'
import type { PayRequest } from './components/review-dialog'
import type { CheckoutValues } from './schemas'
import type { CheckoutQuote, PaymentResult, QuoteResult } from './types'

const ORDER_ATTEMPTS = 3
const WALLET_DISCONNECTED_MESSAGE =
  'A carteira foi desconectada. Confirme novamente para reconectar e continuar o pagamento.'
const RETRY_DELAY_MS = 600

export function toCheckoutQuote(dto: QuoteDto): CheckoutQuote {
  return {
    id: dto.id,
    lines: dto.lines.map((line) => ({
      id: line.lineId,
      nftId: line.nftId,
      name: line.name,
      artwork: line.artwork,
      tokenId: line.tokenId,
      edition: { id: line.editionId, label: line.editionLabel },
      unitPriceEth: line.unitPriceEth,
      quantity: line.quantity,
      maxQuantity: line.quantity,
    })),
    totals: dto.totals,
    coupon: dto.coupon ?? undefined,
  }
}

const sameQuote = (a: CheckoutQuote, b: CheckoutQuote) =>
  a.totals.totalEth === b.totals.totalEth &&
  a.lines.length === b.lines.length &&
  a.lines.every((line, index) => {
    const other = b.lines[index]
    return (
      other?.id === line.id &&
      other.quantity === line.quantity &&
      other.unitPriceEth === line.unitPriceEth
    )
  })

/** Explica em uma frase o que mudou entre a revisão e a revalidação. */
function describeChanges(before: CheckoutQuote, after: CheckoutQuote) {
  const messages = after.lines.flatMap((line) => {
    const previous = before.lines.find((item) => item.id === line.id)
    if (!previous || previous.unitPriceEth === line.unitPriceEth) return []
    return [
      `O preço de ${line.name} mudou de ${formatEth(previous.unitPriceEth)} para ${formatEth(line.unitPriceEth)}.`,
    ]
  })
  if (before.totals.networkFeeEth !== after.totals.networkFeeEth) {
    messages.push(
      `A taxa de rede mudou de ${formatEth(before.totals.networkFeeEth)} para ${formatEth(after.totals.networkFeeEth)}.`,
    )
  }
  if (Boolean(before.coupon) !== Boolean(after.coupon)) {
    messages.push('O cupom aplicado mudou.')
  }
  return messages.join(' ') || 'Os itens ou valores mudaram desde a sua revisão.'
}

const errorMessage = (error: unknown) =>
  isApiError(error) ? error.message : 'Algo deu errado. Tente novamente.'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Cria o pedido reenviando a mesma chave de idempotência quando a resposta se perde (rede,
 * timeout, 503): se o pedido já tinha sido criado, a API devolve o mesmo pedido em vez de outro.
 */
async function createOrder(key: string, body: unknown): Promise<OrderDto> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await apiRequest(orderSchema, {
        method: 'POST',
        url: API_PATHS.orders,
        data: body,
        headers: { [IDEMPOTENCY_HEADER]: key },
      })
    } catch (error) {
      if (!isApiError(error) || !error.retryable || attempt >= ORDER_ATTEMPTS) throw error
      await wait(RETRY_DELAY_MS * attempt)
    }
  }
}

/** Revisão e pagamento: cotação, conexão da carteira simulada e criação do pedido. */
export function useCheckout(cartVersion: number) {
  const connection = useRef<WalletConnectionDto | undefined>(undefined)

  // A carteira pode encerrar a conexão a qualquer momento: a próxima tentativa conecta de novo.
  useEffect(
    () =>
      onWalletDisconnected((connectionId) => {
        if (connection.current?.id !== connectionId) return
        connection.current = undefined
        toast.error(WALLET_DISCONNECTED_MESSAGE)
      }),
    [],
  )

  const fetchQuote = async (values: CheckoutValues) =>
    toCheckoutQuote(
      await apiRequest(quoteSchema, {
        method: 'POST',
        url: API_PATHS.quote,
        data: { network: values.network, cartVersion },
      }),
    )

  async function connect(values: CheckoutValues) {
    const current = connection.current
    const reusable =
      current &&
      current.provider === values.provider &&
      current.network === values.network &&
      current.address.toLowerCase() === values.walletAddress.toLowerCase() &&
      Date.parse(current.expiresAt) > Date.now()
    if (reusable) return current
    connection.current = await apiRequest(walletConnectionSchema, {
      method: 'POST',
      url: API_PATHS.walletConnections,
      data: {
        provider: values.provider,
        network: values.network,
        address: values.walletAddress,
      },
    })
    return connection.current
  }

  async function quote(values: CheckoutValues): Promise<QuoteResult> {
    try {
      return { ok: true, quote: await fetchQuote(values) }
    } catch (error) {
      return { ok: false, message: errorMessage(error) }
    }
  }

  async function pay(values: CheckoutValues, request: PayRequest): Promise<PaymentResult> {
    let wallet: WalletConnectionDto
    try {
      request.onStep('connecting')
      wallet = await connect(values)
    } catch (error) {
      if (isApiError(error, 'WALLET_REJECTED')) {
        return { kind: 'wallet-rejected', message: error.message }
      }
      return { kind: 'error', message: errorMessage(error) }
    }

    let fresh: CheckoutQuote
    try {
      request.onStep('quoting')
      fresh = await fetchQuote(values)
    } catch (error) {
      return { kind: 'error', message: errorMessage(error) }
    }
    if (!sameQuote(request.quote, fresh)) {
      return { kind: 'quote-changed', quote: fresh, message: describeChanges(request.quote, fresh) }
    }

    try {
      request.onStep('signing')
      // O corpo usa a cotação revisada, então reenvios com a mesma chave têm o mesmo conteúdo.
      const order = await createOrder(request.idempotencyKey, {
        quoteId: request.quote.id,
        walletConnectionId: wallet.id,
        collector: {
          displayName: values.displayName,
          username: values.username,
          profileName: values.profileName,
          email: values.email,
          ensName: values.ensName,
          referralCode: values.referralCode,
          secondaryWallet: values.secondaryWallet,
        },
        note: values.note,
      })
      return { kind: 'placed', orderId: order.id }
    } catch (error) {
      if (isApiError(error, 'QUOTE_EXPIRED')) {
        return {
          kind: 'quote-changed',
          quote: fresh,
          message: 'A cotação expirou e foi renovada.',
        }
      }
      if (isApiError(error, 'QUOTE_CHANGED')) {
        const parsed = quoteSchema.safeParse((error.details as { quote?: unknown })?.quote)
        if (parsed.success) {
          const next = toCheckoutQuote(parsed.data)
          return {
            kind: 'quote-changed',
            quote: next,
            message: describeChanges(request.quote, next),
          }
        }
      }
      if (isApiError(error, 'VALIDATION_ERROR')) connection.current = undefined
      return { kind: 'error', message: errorMessage(error) }
    }
  }

  return { quote, pay }
}

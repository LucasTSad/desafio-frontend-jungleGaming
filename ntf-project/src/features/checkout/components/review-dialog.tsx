import { Check, CircleAlert, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatEth } from '@/features/catalog/format'
import type { AppliedCoupon } from '@/features/cart/types'
import { shortenHex } from '../format'
import type { CheckoutValues } from '../schemas'
import {
  networkLabel,
  providerLabel,
  type CheckoutQuote,
  type PaymentResult,
  type PaymentStep,
} from '../types'
import { CheckoutItems, CheckoutTotals } from './checkout-summary'

export type PayRequest = {
  idempotencyKey: string
  quote: CheckoutQuote
  onStep: (step: PaymentStep) => void
}

type ReviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  values: CheckoutValues
  quote: CheckoutQuote
  coupon?: AppliedCoupon
  onPay: (request: PayRequest) => Promise<PaymentResult>
  onPlaced: (orderId: string) => void
}

export function ReviewDialog({ open, onOpenChange, ...props }: ReviewDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onInteractOutside={(event) => busy && event.preventDefault()}
        className="max-h-[calc(100dvh-2rem)] max-w-[min(560px,calc(100%-2rem))] gap-0 overflow-y-auto rounded-md border-b-[10px] border-primary bg-surface p-0 text-foreground ring-0 sm:max-w-[min(560px,calc(100%-2rem))]"
      >
        <ReviewBody {...props} onBusyChange={setBusy} />
      </DialogContent>
    </Dialog>
  )
}

const STEPS: { step: PaymentStep; label: string }[] = [
  { step: 'connecting', label: 'Conectar a carteira' },
  { step: 'quoting', label: 'Revalidar preço, disponibilidade e taxas' },
  { step: 'signing', label: 'Assinar o pagamento' },
]

type Phase =
  | { kind: 'review' }
  | { kind: 'processing'; step: PaymentStep }
  | { kind: 'wallet-rejected'; message: string }
  | { kind: 'quote-changed'; message: string; previousTotal: number }
  | { kind: 'error'; message: string }

type ReviewBodyProps = Omit<ReviewDialogProps, 'open' | 'onOpenChange'> & {
  onBusyChange: (busy: boolean) => void
}

function ReviewBody({
  values,
  quote: initialQuote,
  coupon,
  onPay,
  onPlaced,
  onBusyChange,
}: ReviewBodyProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'review' })
  const [quote, setQuote] = useState(initialQuote)
  // A mesma chave é reenviada em novas tentativas da mesma revisão; muda se a cotação mudar.
  const idempotencyKey = useRef(crypto.randomUUID())
  const processing = phase.kind === 'processing'

  async function pay() {
    if (processing) return
    onBusyChange(true)
    setPhase({ kind: 'processing', step: 'connecting' })
    const result = await onPay({
      idempotencyKey: idempotencyKey.current,
      quote,
      onStep: (step) => setPhase({ kind: 'processing', step }),
    })
    onBusyChange(false)

    if (result.kind === 'placed') onPlaced(result.orderId)
    else if (result.kind === 'quote-changed') {
      setPhase({
        kind: 'quote-changed',
        message: result.message,
        previousTotal: quote.totals.totalEth,
      })
      setQuote(result.quote)
      idempotencyKey.current = crypto.randomUUID()
    } else
      setPhase(
        result.kind === 'wallet-rejected' ? result : { kind: 'error', message: result.message },
      )
  }

  const actionLabel =
    phase.kind === 'quote-changed'
      ? 'Confirmar novo total'
      : phase.kind === 'wallet-rejected' || phase.kind === 'error'
        ? 'Tentar novamente'
        : `Confirmar e pagar ${formatEth(quote.totals.totalEth)}`

  return (
    <div className="flex min-w-0 flex-col gap-5 px-5 pt-6 pb-8 sm:px-8">
      <div className="flex flex-col gap-1.5 pr-6">
        <DialogTitle className="text-lg font-bold">Revisar compra</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Confira os dados antes de pagar. O valor será cobrado pela{' '}
          {providerLabel(values.provider)}.
        </DialogDescription>
      </div>

      <CheckoutItems lines={quote.lines} compact />

      <dl className="grid gap-x-4 gap-y-2 rounded-md border border-border p-4 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Colecionador</dt>
        <dd>
          {values.displayName} (@{values.username}) · {values.email}
        </dd>
        <dt className="text-muted-foreground">Carteira de destino</dt>
        <dd>
          <span title={values.walletAddress}>{shortenHex(values.walletAddress)}</span> ·{' '}
          {networkLabel(values.network)}
        </dd>
        <dt className="text-muted-foreground">Pagamento</dt>
        <dd>{providerLabel(values.provider)}</dd>
      </dl>

      <CheckoutTotals totals={quote.totals} coupon={coupon} />

      {phase.kind === 'quote-changed' && (
        <div
          role="alert"
          className="flex gap-3 rounded-md border border-warning/50 bg-warning/10 p-3 text-sm"
        >
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden="true" />
          <p>
            <strong className="block">O total mudou</strong>
            {phase.message} Novo total: {formatEth(quote.totals.totalEth)} (antes{' '}
            {formatEth(phase.previousTotal)}). Confirme novamente para continuar.
          </p>
        </div>
      )}
      {(phase.kind === 'wallet-rejected' || phase.kind === 'error') && (
        <div
          role="alert"
          className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{phase.message}</p>
        </div>
      )}

      {processing && <PaymentProgress current={phase.step} />}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button
            variant="outline"
            aria-disabled={processing || undefined}
            className="h-11 text-sm"
          >
            Voltar e editar
          </Button>
        </DialogClose>
        <Button
          onClick={() => void pay()}
          aria-disabled={processing || undefined}
          className="h-11 text-sm font-bold"
        >
          {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {processing ? 'Processando…' : actionLabel}
        </Button>
      </div>
    </div>
  )
}

function PaymentProgress({ current }: { current: PaymentStep }) {
  const currentIndex = STEPS.findIndex((item) => item.step === current)

  return (
    <div role="status" className="rounded-md bg-background/60 p-4">
      <p className="text-sm font-semibold">
        Não feche esta janela enquanto o pagamento é processado.
      </p>
      <ol className="mt-3 flex flex-col gap-2 text-sm">
        {STEPS.map((item, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'todo'
          return (
            <li
              key={item.step}
              className={cn(
                'flex items-center gap-2',
                state === 'todo' && 'text-subtle-foreground',
                state === 'active' && 'font-semibold text-brand',
              )}
            >
              {state === 'done' && <Check className="size-4 text-success" aria-hidden="true" />}
              {state === 'active' && (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              )}
              {state === 'todo' && <span aria-hidden="true" className="size-4" />}
              {item.label}
              <span className="sr-only">
                {state === 'done' ? ' (concluído)' : state === 'active' ? ' (em andamento)' : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

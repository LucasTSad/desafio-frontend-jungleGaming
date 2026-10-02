import { Link } from '@tanstack/react-router'
import { type FormEvent, useId, useState } from 'react'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/features/catalog/format'
import type { AppliedCoupon, CartTotals, CouponResult } from '../types'

type CartSummaryProps = {
  totals: CartTotals
  coupon?: AppliedCoupon
  checkoutBlockedReason?: string
  onApplyCoupon: (code: string) => CouponResult
  onRemoveCoupon: () => void
  onCheckout: () => void
}

export function CartSummary({
  totals,
  coupon,
  checkoutBlockedReason,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
}: CartSummaryProps) {
  const headingId = useId()
  const blockedId = useId()

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col max-md:-mx-4 max-md:rounded-t-[32px] max-md:bg-surface max-md:px-6 max-md:pt-6 max-md:pb-8"
    >
      <h2
        id={headingId}
        className="max-md:sr-only md:border-b md:border-border md:pb-3 md:text-lg md:font-semibold"
      >
        Resumo da carteira
      </h2>

      <CouponForm coupon={coupon} onApply={onApplyCoupon} onRemove={onRemoveCoupon} />

      <dl className="mt-4 flex flex-col gap-3 text-base md:mt-5">
        <SummaryRow label="Subtotal" value={formatEth(totals.subtotalEth)} />
        <SummaryRow
          label="Desconto do lançamento"
          value={`(-) ${formatEth(totals.discountEth).replace(' ETH', '')}`}
          srSuffix=" ETH"
        />
        <div>
          <SummaryRow label="Taxa de rede" value={formatEth(totals.networkFeeEth)} />
          <p className="mt-1 text-right text-xs text-brand">Taxa estimada</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 font-bold">
          <dt>Total</dt>
          <dd className="text-xl text-brand md:text-base">{formatEth(totals.totalEth)}</dd>
        </div>
      </dl>

      <Button
        onClick={onCheckout}
        disabled={Boolean(checkoutBlockedReason)}
        aria-describedby={checkoutBlockedReason ? blockedId : undefined}
        className="mt-6 h-14 w-full rounded-full bg-primary-gradient text-base font-bold md:mt-7 md:h-10 md:rounded-sm md:bg-primary md:bg-none"
      >
        Conectar e finalizar
      </Button>
      {checkoutBlockedReason && (
        <p id={blockedId} className="mt-2 text-center text-xs text-destructive">
          {checkoutBlockedReason}
        </p>
      )}
      <Link
        to="/"
        hash="mercado"
        className="mt-3 hidden text-center text-base text-brand hover:underline md:block"
      >
        Continuar explorando
      </Link>
    </section>
  )
}

type SummaryRowProps = { label: string; value: string; srSuffix?: string }

function SummaryRow({ label, value, srSuffix }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd className="text-right whitespace-nowrap">
        {value}
        {srSuffix && <span className="sr-only">{srSuffix}</span>}
      </dd>
    </div>
  )
}

type CouponFormProps = {
  coupon?: AppliedCoupon
  onApply: (code: string) => CouponResult
  onRemove: () => void
}

function CouponForm({ coupon, onApply, onRemove }: CouponFormProps) {
  const inputId = useId()
  const errorId = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()

  if (coupon) {
    return (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
        <p>
          Cupom <strong>{coupon.code}</strong> aplicado
          <span className="block text-xs text-muted-foreground">{coupon.description}</span>
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-semibold text-brand hover:underline"
        >
          Remover
        </button>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      setError('Informe um código promocional.')
      return
    }
    const result = onApply(code)
    setError(result.ok ? undefined : result.message)
    if (result.ok) setCode('')
  }

  return (
    <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-bold max-md:sr-only">
        Código promocional
      </label>
      <div className="flex">
        <input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            setError(undefined)
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-[50px] min-w-0 flex-1 rounded-l-full border border-r-0 border-input bg-transparent pl-6 text-[13px] outline-none placeholder:text-subtle-foreground focus-visible:border-primary md:h-10 md:rounded-l-sm md:border-primary md:pl-2',
            error && 'border-destructive md:border-destructive',
          )}
        />
        <Button
          type="submit"
          className="h-[50px] w-[100px] shrink-0 rounded-full bg-primary-gradient text-base font-bold max-md:-ml-6 md:h-10 md:rounded-l-none md:rounded-r-sm md:bg-primary md:bg-none"
        >
          Aplicar
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}

export function CartSummarySkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

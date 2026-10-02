import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import { formatEth } from '@/features/catalog/format'
import { multiplyEth } from '@/lib/eth'
import type { AppliedCoupon, CartLine, CartTotals } from '@/features/cart/types'

const lineSubtotal = (line: CartLine) => multiplyEth(line.unitPriceEth, line.quantity)

export function CheckoutItems({
  lines,
  compact = false,
}: {
  lines: CartLine[]
  compact?: boolean
}) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="flex justify-between border-b border-border pb-2 text-[15px] font-semibold"
      >
        <span>NFTs</span>
        <span>Subtotal</span>
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {lines.map((line) => (
          <li
            key={line.id}
            className={cn(
              'flex items-center gap-3 bg-surface pr-4',
              compact ? 'rounded-md' : 'min-h-[70px]',
            )}
          >
            <NftImage
              src={line.artwork.src}
              alt=""
              sizes="70px"
              className={cn('shrink-0 rounded-sm', compact ? 'size-12' : 'size-[70px]')}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold break-words">{line.name}</p>
              <p className="text-[13px] text-subtle-foreground">
                ID do token: {line.tokenId}
                <span className="sr-only">, edição {line.edition.label}</span>
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-3',
                compact && 'flex-col-reverse items-end gap-0',
              )}
            >
              <span className="text-[13px] whitespace-nowrap text-muted-foreground">
                <span aria-hidden="true">(x {line.quantity})</span>
                <span className="sr-only">{line.quantity} unidades</span>
              </span>
              <span
                className={cn(
                  'font-bold whitespace-nowrap text-brand',
                  compact ? 'text-base' : 'text-lg',
                )}
              >
                {formatEth(lineSubtotal(line))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

type CheckoutTotalsProps = {
  totals: CartTotals
  coupon?: AppliedCoupon
  showPromoLink?: boolean
}

export function CheckoutTotals({ totals, coupon, showPromoLink = false }: CheckoutTotalsProps) {
  return (
    <div className="flex flex-col">
      {showPromoLink && (
        <p className="mb-3 text-center text-sm">
          {coupon ? <>Cupom {coupon.code} aplicado. </> : <>Tem um código promocional? </>}
          <Link to="/carrinho" className="text-brand hover:underline">
            {coupon ? 'Alterar no carrinho' : 'Aplique aqui'}
          </Link>
        </p>
      )}
      <dl className="flex flex-col gap-2 text-[15px]">
        <TotalsRow label="Subtotal" value={formatEth(totals.subtotalEth)} />
        <TotalsRow
          label="Desconto do lançamento"
          value={`(-) ${formatEth(totals.discountEth).replace(' ETH', '')}`}
          srSuffix=" ETH"
        />
        <TotalsRow label="Taxa de rede" value={formatEth(totals.networkFeeEth)} />
      </dl>
      <p className="mt-2 text-center text-xs text-brand">Taxa estimada</p>
      <dl className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between gap-4 font-bold">
          <dt className="text-base">Total</dt>
          <dd className="text-lg text-brand">{formatEth(totals.totalEth)}</dd>
        </div>
      </dl>
    </div>
  )
}

function TotalsRow({
  label,
  value,
  srSuffix,
}: {
  label: string
  value: string
  srSuffix?: string
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="whitespace-nowrap">
        {value}
        {srSuffix && <span className="sr-only">{srSuffix}</span>}
      </dd>
    </div>
  )
}

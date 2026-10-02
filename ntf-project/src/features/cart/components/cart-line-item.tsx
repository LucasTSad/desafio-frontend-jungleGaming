import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import { QuantityStepper } from '@/components/common/quantity-stepper'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/features/catalog/format'
import { multiplyEth } from '@/lib/eth'
import type { CartLine } from '../types'

export const CART_COLUMNS =
  'md:grid md:grid-cols-[minmax(0,311px)_minmax(0,138px)_minmax(0,137px)_minmax(0,1fr)_40px] md:items-center'

const lineTotal = (line: CartLine) => multiplyEth(line.unitPriceEth, line.quantity)

type CartLineItemProps = {
  line: CartLine
  onQuantityChange: (line: CartLine, quantity: number) => void
  onRemove: (line: CartLine) => void
}

export function CartLineItem({ line, onQuantityChange, onRemove }: CartLineItemProps) {
  const unavailable = line.status?.kind === 'unavailable'
  const priceChanged = line.status?.kind === 'price-changed' ? line.status : undefined

  return (
    <article
      aria-label={line.name}
      className={cn(
        'relative flex overflow-hidden rounded-2xl bg-surface md:min-h-[70px] md:overflow-visible md:rounded-none md:bg-transparent',
        CART_COLUMNS,
        unavailable && 'ring-1 ring-destructive/60 md:ring-0',
      )}
    >
      <div className="flex shrink-0 md:items-center md:self-stretch">
        <NftImage
          src={line.artwork.src}
          alt=""
          sizes="(min-width: 768px) 70px, 94px"
          className={cn(
            'size-[94px] rounded-l-2xl md:size-[70px] md:rounded-md',
            unavailable && 'opacity-50',
          )}
        />
        <div className="hidden h-full flex-1 flex-col justify-center gap-1 bg-surface py-2 pl-4 md:flex">
          <LineName line={line} />
          <p className="flex items-center gap-2 text-sm text-subtle-foreground">
            ID do token: {line.tokenId}
            <span className="rounded-full border border-input px-1.5 text-xs text-muted-foreground">
              <span className="sr-only">Edição </span>
              {line.edition.label}
            </span>
          </p>
          <LineStatus line={line} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-3 pr-3 pl-4 md:hidden">
        <LineName line={line} />
        <p className="text-[13px] text-muted-foreground">Edição: {line.edition.label}</p>
        <p className="text-[17px] font-bold text-brand">
          <span className="sr-only">Total do item: </span>
          {formatEth(lineTotal(line))}
        </p>
        <LineStatus line={line} />
      </div>

      <p className="hidden h-full items-center bg-surface text-base font-bold text-muted-foreground md:flex">
        <span className="sr-only">Preço unitário: </span>
        {formatEth(line.unitPriceEth)}
        {priceChanged && (
          <span className="sr-only">, antes {formatEth(priceChanged.previousPriceEth)}</span>
        )}
      </p>

      <div className="absolute top-1/2 right-3 mt-2 -translate-y-1/2 md:static md:mt-0 md:flex md:h-full md:translate-y-0 md:items-center md:bg-surface">
        <QuantityStepper
          value={line.quantity}
          max={unavailable ? line.quantity : line.maxQuantity}
          onChange={(quantity) => onQuantityChange(line, quantity)}
          itemLabel={line.name}
          variant="circle"
          className={cn('hidden md:flex', unavailable && 'pointer-events-none opacity-40')}
        />
        <QuantityStepper
          value={line.quantity}
          max={unavailable ? line.quantity : line.maxQuantity}
          onChange={(quantity) => onQuantityChange(line, quantity)}
          itemLabel={line.name}
          variant="ghost"
          className={cn('md:hidden', unavailable && 'pointer-events-none opacity-40')}
        />
      </div>

      <p className="hidden h-full items-center bg-surface text-base font-bold text-brand md:flex">
        <span className="sr-only">Total do item: </span>
        {formatEth(lineTotal(line))}
      </p>

      <div className="absolute top-1.5 right-1.5 md:static md:flex md:h-full md:items-center md:bg-surface">
        <button
          type="button"
          onClick={() => onRemove(line)}
          className="flex size-8 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-5" aria-hidden="true" />
          <span className="sr-only">Remover {line.name} do carrinho</span>
        </button>
      </div>
    </article>
  )
}

function LineName({ line }: { line: CartLine }) {
  return (
    <h3 className="pr-8 text-[15px] font-bold md:pr-0 md:text-base">
      <Link
        to="/nft/$nftId"
        params={{ nftId: line.nftId }}
        className="hover:text-brand hover:underline"
      >
        {line.name}
      </Link>
    </h3>
  )
}

function LineStatus({ line }: { line: CartLine }) {
  if (line.status?.kind === 'unavailable') {
    return (
      <p className="text-xs font-semibold text-destructive">Indisponível — remova para continuar</p>
    )
  }
  if (line.status?.kind === 'price-changed') {
    return (
      <p className="text-xs font-semibold text-warning">
        Preço atualizado (antes {formatEth(line.status.previousPriceEth)})
      </p>
    )
  }
  return null
}

export function CartLineSkeleton() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex gap-4 rounded-2xl bg-surface md:min-h-[70px] md:rounded-none',
        CART_COLUMNS,
      )}
    >
      <div className="flex items-center gap-4">
        <Skeleton className="size-[94px] rounded-l-2xl md:size-[70px] md:rounded-md" />
        <div className="hidden flex-1 flex-col gap-2 md:flex">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-2 py-3 pr-4 md:hidden">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="hidden h-4 w-20 md:block" />
      <Skeleton className="hidden h-6 w-20 md:block" />
      <Skeleton className="hidden h-4 w-20 md:block" />
    </div>
  )
}

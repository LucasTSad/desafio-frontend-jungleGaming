import { Link } from '@tanstack/react-router'
import { CircleAlert, ShoppingCart } from 'lucide-react'
import { StatusMessage } from '@/components/common/status-message'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { NftRail } from '@/features/catalog/components/nft-rail'
import type { CatalogStatus, NftSummary } from '@/features/catalog/types'
import type { AppliedCoupon, CartLine, CartTotals, CouponResult } from '../types'
import { CartChangesBanner } from './cart-changes-banner'
import { CART_COLUMNS, CartLineItem, CartLineSkeleton } from './cart-line-item'
import { CartSummary, CartSummarySkeleton } from './cart-summary'

type CartViewProps = {
  status: CatalogStatus
  lines: CartLine[]
  totals: CartTotals
  coupon?: AppliedCoupon
  recommendations: NftSummary[]
  favoriteIds: ReadonlySet<string>
  onToggleFavorite: (nft: NftSummary) => void
  onQuantityChange: (line: CartLine, quantity: number) => void
  onRemove: (line: CartLine) => void
  onApplyCoupon: (code: string) => CouponResult
  onRemoveCoupon: () => void
  onCheckout: () => void
  onRetry: () => void
}

export function CartView(props: CartViewProps) {
  const { status, lines, recommendations, favoriteIds, onToggleFavorite } = props

  return (
    <>
      <MobileTopBar title="Carrinho de NFTs" fallbackTo="/" />
      <div className="page-container pb-16 md:pt-5 md:pb-24">
        <PageBreadcrumbs
          items={[
            { label: 'Início', link: { to: '/' } },
            { label: 'Mercado', link: { to: '/', hash: 'mercado' } },
            { label: 'Carrinho' },
          ]}
        />
        <h1 className="sr-only max-md:hidden">Carrinho de NFTs</h1>

        <CartContent {...props} />

        <NftRail
          title="Colecionadores também viram"
          items={recommendations}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          className={lines.length > 0 || status !== 'success' ? 'mt-16 md:mt-[150px]' : 'mt-12'}
        />
      </div>
    </>
  )
}

function CartContent({
  status,
  lines,
  totals,
  coupon,
  onQuantityChange,
  onRemove,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  onRetry,
}: CartViewProps) {
  if (status === 'error') {
    return (
      <StatusMessage
        role="alert"
        className="mt-6"
        icon={<CircleAlert className="size-7" aria-hidden="true" />}
        title="Não foi possível carregar seu carrinho"
        description="Verifique sua conexão e tente novamente."
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }

  if (status === 'success' && lines.length === 0) {
    return (
      <StatusMessage
        className="mt-6"
        icon={<ShoppingCart className="size-7" aria-hidden="true" />}
        title="Seu carrinho está vazio"
        description="Explore o mercado e adicione os NFTs que você quer colecionar."
        action={
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        }
      />
    )
  }

  const loading = status === 'loading'
  const blocked = lines.some((line) => line.status?.kind === 'unavailable')

  return (
    <div className="mt-2 grid gap-8 md:mt-4 lg:grid-cols-[minmax(0,782px)_minmax(0,332px)] lg:justify-between lg:gap-12">
      <section
        aria-labelledby="cart-items-heading"
        aria-busy={loading}
        className="flex flex-col gap-4"
      >
        <h2 id="cart-items-heading" className="sr-only">
          Itens do carrinho
        </h2>
        <div
          aria-hidden="true"
          className={`hidden border-b border-border pb-3 text-[15px] font-semibold ${CART_COLUMNS}`}
        >
          <span>NFTs</span>
          <span>Preço</span>
          <span>Edições</span>
          <span>Total</span>
        </div>
        {!loading && <CartChangesBanner lines={lines} />}
        <ul className="flex flex-col gap-4 md:gap-3">
          {loading
            ? Array.from({ length: 3 }, (_, index) => (
                <li key={index}>
                  <CartLineSkeleton />
                </li>
              ))
            : lines.map((line) => (
                <li key={line.id}>
                  <CartLineItem
                    line={line}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                  />
                </li>
              ))}
        </ul>
      </section>

      {loading ? (
        <CartSummarySkeleton />
      ) : (
        <CartSummary
          totals={totals}
          coupon={coupon}
          checkoutBlockedReason={
            blocked ? 'Remova os itens indisponíveis para continuar.' : undefined
          }
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
          onCheckout={onCheckout}
        />
      )}
    </div>
  )
}

import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { cn } from 'cn'
import { QuantityStepper } from '@/components/common/quantity-stepper'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftRail } from '@/features/catalog/components/nft-rail'
import { formatEth } from '@/features/catalog/format'
import { CATALOG_COLLECTIONS } from '@/features/catalog/search-params'
import type { NftSummary } from '@/features/catalog/types'
import { type EditionId, maxQuantityFor, type NftDetail, type NftReview } from '../types'
import { EditionPicker } from './edition-picker'
import { NftDetailTabs, type NftDetailTab } from './nft-detail-tabs'
import { NftGallery } from './nft-gallery'
import { ShareLinks } from './share-links'
import { formatRating } from '../format'
import { StarRating } from './star-rating'

export type PurchaseSelection = { editionId: EditionId; quantity: number }

type NftDetailViewProps = {
  nft: NftDetail
  reviews: NftReview[]
  related: NftSummary[]
  favoriteIds: ReadonlySet<string>
  shareUrl: string
  onToggleFavorite: (nft: NftSummary) => void
  onBuy: (selection: PurchaseSelection) => void
  onAddToCart: (selection: PurchaseSelection) => void
}

function defaultEdition(nft: NftDetail): EditionId | undefined {
  const available = nft.editions.filter((edition) => edition.available !== 0)
  return (available.find((edition) => edition.id === '1-50') ?? available[0])?.id
}

export function NftDetailView({
  nft,
  reviews,
  related,
  favoriteIds,
  shareUrl,
  onToggleFavorite,
  onBuy,
  onAddToCart,
}: NftDetailViewProps) {
  const [editionId, setEditionId] = useState(() => defaultEdition(nft))
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<NftDetailTab>('detalhes')

  const edition = nft.editions.find((item) => item.id === editionId)
  const maxQuantity = edition ? maxQuantityFor(edition) : 0
  const soldOut = !edition || maxQuantity === 0
  const isFavorite = favoriteIds.has(nft.id)
  const collectionLabel = CATALOG_COLLECTIONS.find((c) => c.slug === nft.collection)?.label
  const selection = (): PurchaseSelection | undefined =>
    editionId && !soldOut ? { editionId, quantity } : undefined

  const changeEdition = (next: EditionId) => {
    const nextEdition = nft.editions.find((item) => item.id === next)
    setEditionId(next)
    if (nextEdition) setQuantity((current) => Math.min(current, maxQuantityFor(nextEdition)) || 1)
  }

  const showReviews = () => {
    setTab('avaliacoes')
    document.getElementById('nft-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const favoriteLabel = `${isFavorite ? 'Remover' : 'Adicionar'} ${nft.name} ${isFavorite ? 'dos' : 'aos'} favoritos`

  return (
    <>
      <MobileTopBar
        fallbackTo="/"
        action={
          <button
            type="button"
            aria-pressed={isFavorite}
            aria-label={favoriteLabel}
            onClick={() => onToggleFavorite(nft)}
            className="flex size-10 items-center justify-center rounded-full bg-[#2f1d15] text-primary"
          >
            <Heart className={cn('size-5', isFavorite && 'fill-current')} aria-hidden="true" />
          </button>
        }
      />

      <div className="page-container pb-44 md:pt-5 md:pb-20">
        <PageBreadcrumbs
          items={[
            { label: 'Início', link: { to: '/' } },
            { label: 'Mercado', link: { to: '/', hash: 'mercado' } },
            { label: nft.name },
          ]}
        />

        <div className="mt-1 grid gap-8 md:mt-4 md:grid-cols-2 lg:grid-cols-[592px_minmax(0,1fr)] lg:gap-[13px]">
          <NftGallery name={nft.name} images={nft.gallery} />

          <div className="flex flex-col max-md:-mx-4 max-md:-mt-12 max-md:rounded-t-[32px] max-md:bg-surface max-md:px-6 max-md:pt-8 max-md:pb-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-[22px] leading-8 font-bold md:text-[32px] md:leading-10">
                {nft.name}
              </h1>
              <button
                type="button"
                onClick={showReviews}
                className="flex shrink-0 items-center gap-1 rounded-full border border-[#e3a44e] px-2.5 py-1 text-sm md:hidden"
              >
                <Star className="size-4 fill-[#e3a44e] stroke-none" aria-hidden="true" />
                {formatRating(nft.rating.average)}
                <span className="text-muted-foreground">({nft.rating.count})</span>
                <span className="sr-only">avaliações. Ver avaliações</span>
              </button>
            </div>

            <div className="mt-3 hidden flex-wrap items-center justify-between gap-3 border-b border-border pb-3 md:flex">
              <p className="text-[22px] font-bold text-brand">
                <span className="sr-only">Preço: </span>
                {formatEth(nft.priceEth)}
              </p>
              <button
                type="button"
                onClick={showReviews}
                className="flex items-center gap-1.5 text-[15px] hover:text-brand"
              >
                <StarRating value={nft.rating.average} />
                {nft.rating.count} avaliações de colecionadores
              </button>
            </div>

            <h2 className="mt-4 hidden text-[15px] font-bold md:block">Sobre este NFT:</h2>
            <p className="mt-3 text-[15px] leading-[23px] text-muted-foreground md:text-sm md:leading-6">
              {nft.about}
            </p>

            <EditionPicker
              editions={nft.editions}
              value={editionId ?? '1-50'}
              onChange={changeEdition}
              className="mt-4"
            />

            <div className="mt-5 hidden flex-wrap items-center justify-between gap-4 md:flex">
              <QuantityStepper
                value={quantity}
                max={Math.max(maxQuantity, 1)}
                onChange={setQuantity}
                itemLabel={nft.name}
                variant="pill"
                className={cn(soldOut && 'pointer-events-none opacity-40')}
              />
              <div className="flex gap-2.5">
                <Button
                  className="h-10 w-[130px] text-[15px] font-bold"
                  disabled={soldOut}
                  onClick={() => {
                    const value = selection()
                    if (value) onBuy(value)
                  }}
                >
                  {soldOut ? 'ESGOTADO' : 'COMPRAR'}
                </Button>
                <Button
                  variant="outline-primary"
                  className="h-10 w-[130px] text-[15px]"
                  aria-pressed={isFavorite}
                  onClick={() => onToggleFavorite(nft)}
                >
                  <Heart className={cn(isFavorite && 'fill-current')} aria-hidden="true" />
                  {isFavorite ? 'Favoritado' : 'Favoritar'}
                </Button>
              </div>
            </div>
            {edition && maxQuantity > 0 && quantity >= maxQuantity && (
              <p className="mt-2 hidden text-xs text-muted-foreground md:block">
                Limite de {maxQuantity} {maxQuantity === 1 ? 'unidade' : 'unidades'} desta edição
                por pedido.
              </p>
            )}

            <dl className="mt-4 flex flex-col gap-3 text-[15px] text-subtle-foreground md:gap-2.5">
              <div className="flex gap-1.5">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Coleção:</dt>
                <dd>{collectionLabel}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            </dl>

            <div className="mt-4 hidden md:block">
              <ShareLinks name={nft.name} url={shareUrl} />
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-24">
          <NftDetailTabs nft={nft} reviews={reviews} value={tab} onChange={setTab} />
        </div>

        <NftRail
          title="Mais desta coleção"
          items={related}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          className="mt-16 md:mt-24"
        />
      </div>

      <MobilePurchaseBar
        nft={nft}
        quantity={quantity}
        maxQuantity={maxQuantity}
        soldOut={soldOut}
        onQuantityChange={setQuantity}
        onBuy={() => {
          const value = selection()
          if (value) onBuy(value)
        }}
        onAddToCart={() => {
          const value = selection()
          if (value) onAddToCart(value)
        }}
      />
    </>
  )
}

type MobilePurchaseBarProps = {
  nft: NftDetail
  quantity: number
  maxQuantity: number
  soldOut: boolean
  onQuantityChange: (value: number) => void
  onBuy: () => void
  onAddToCart: () => void
}

function MobilePurchaseBar({
  nft,
  quantity,
  maxQuantity,
  soldOut,
  onQuantityChange,
  onBuy,
  onAddToCart,
}: MobilePurchaseBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 rounded-t-[32px] bg-surface px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgb(0_0_0/0.45)] md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground" aria-hidden="true">
            Qtd.
          </span>
          <QuantityStepper
            value={quantity}
            max={Math.max(maxQuantity, 1)}
            onChange={onQuantityChange}
            itemLabel={nft.name}
            variant="compact"
            className={cn(soldOut && 'pointer-events-none opacity-40')}
          />
        </div>
        <p className="text-xl font-bold text-brand">
          <span className="sr-only">Total: </span>
          {formatEth(Math.round(nft.priceEth * quantity * 1e4) / 1e4)}
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          variant="gradient"
          size="pill"
          className="flex-1 text-base font-bold"
          disabled={soldOut}
          onClick={onBuy}
        >
          {soldOut ? 'Esgotado' : 'Comprar NFT'}
        </Button>
        <button
          type="button"
          disabled={soldOut}
          onClick={onAddToCart}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#2f1d15] text-subtle-foreground transition-colors hover:text-brand disabled:opacity-40"
        >
          <ShoppingCart className="size-5" aria-hidden="true" />
          <span className="sr-only">Adicionar ao carrinho</span>
        </button>
      </div>
    </div>
  )
}

export function NftDetailSkeleton() {
  return (
    <div className="page-container pt-4 pb-20 md:pt-12" role="status" aria-label="Carregando NFT">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[592px_minmax(0,1fr)] lg:gap-[13px]">
        <div className="flex gap-12">
          <div className="hidden flex-col gap-4 lg:flex">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="size-[100px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="aspect-square flex-1 rounded-3xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-20 w-2/3" />
        </div>
      </div>
    </div>
  )
}

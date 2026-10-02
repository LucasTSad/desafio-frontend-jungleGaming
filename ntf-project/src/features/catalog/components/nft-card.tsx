import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '../format'
import type { NftSummary } from '../types'

const CARD_IMAGE_SIZES = '(min-width: 1280px) 250px, (min-width: 768px) 30vw, 45vw'

type NftCardProps = {
  nft: NftSummary
  isFavorite: boolean
  onToggleFavorite: (nft: NftSummary) => void
  priority?: boolean
}

export function NftCard({ nft, isFavorite, onToggleFavorite, priority }: NftCardProps) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative rounded-2xl bg-surface p-1 pb-6 md:rounded-none md:px-1 md:py-[25px]">
        <NftImage
          src={nft.artwork.src}
          alt={nft.artwork.alt}
          sizes={CARD_IMAGE_SIZES}
          priority={priority}
          className="aspect-square rounded-xl transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {nft.isRare && (
          <span className="absolute top-4 left-0 bg-primary px-2 py-1 text-xs font-medium text-primary-foreground md:text-sm">
            RARO
          </span>
        )}
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={`${isFavorite ? 'Remover' : 'Adicionar'} ${nft.name} ${isFavorite ? 'dos' : 'aos'} favoritos`}
          onClick={() => onToggleFavorite(nft)}
          className={cn(
            'absolute top-3 right-3 z-10 flex size-[30px] items-center justify-center rounded-full bg-[#2f1d15] text-primary transition-opacity md:top-8 md:right-3',
            !isFavorite &&
              '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100',
          )}
        >
          <Heart className={cn('size-4', isFavorite && 'fill-current')} aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-col gap-1 px-2 md:px-0">
        <h3 className="text-[15px] leading-5 md:text-base">
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ring"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-baseline gap-x-3 text-[15px] md:text-[17px]">
          <span className="font-bold text-brand">
            <span className="sr-only">Preço: </span>
            {formatEth(nft.priceEth)}
          </span>
          {nft.previousPriceEth !== undefined && (
            <span className="text-subtle-foreground">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="rounded-2xl bg-surface p-1 pb-6 md:rounded-none md:px-1 md:py-[25px]">
        <Skeleton className="aspect-square rounded-xl" />
      </div>
      <div className="flex flex-col gap-2 px-2 md:px-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

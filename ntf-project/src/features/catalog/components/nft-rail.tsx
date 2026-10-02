import { useEffect, useId, useReducer, useState } from 'react'
import { cn } from 'cn'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import type { NftSummary } from '../types'
import { NftCard } from './nft-card'

type NftRailProps = {
  title: string
  items: NftSummary[]
  favoriteIds: ReadonlySet<string>
  onToggleFavorite: (nft: NftSummary) => void
  className?: string
}

export function NftRail({ title, items, favoriteIds, onToggleFavorite, className }: NftRailProps) {
  const headingId = useId()
  const [api, setApi] = useState<CarouselApi>()
  const [, rerender] = useReducer((count: number) => count + 1, 0)

  // Os grupos (snaps) dependem da largura; lidos do embla a cada render e atualizados nos eventos.
  useEffect(() => {
    if (!api) return
    api.on('reInit', rerender)
    api.on('select', rerender)
    return () => {
      api.off('reInit', rerender)
      api.off('select', rerender)
    }
  }, [api])

  const snaps = api?.scrollSnapList().length ?? 0
  const selected = api?.selectedScrollSnap() ?? 0

  if (items.length === 0) return null

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-8', className)}>
      <h2 id={headingId} className="border-b border-border pb-3 text-base font-bold text-brand">
        {title}
      </h2>
      <Carousel
        setApi={setApi}
        opts={{ align: 'start', slidesToScroll: 'auto' }}
        aria-labelledby={headingId}
      >
        <CarouselContent className="-ml-4 lg:-ml-[25px]">
          {items.map((nft, index) => (
            <CarouselItem
              key={nft.id}
              aria-label={`${index + 1} de ${items.length}`}
              className="basis-[46%] pl-4 sm:basis-1/3 lg:basis-1/5 lg:pl-[25px]"
            >
              <NftCard
                nft={nft}
                isFavorite={favoriteIds.has(nft.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {snaps > 1 && (
          <div className="mt-6 flex justify-center">
            {Array.from({ length: snaps }, (_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Mostrar grupo ${index + 1} de ${snaps}`}
                aria-current={index === selected}
                onClick={() => api?.scrollTo(index)}
                className="group flex size-6 items-center justify-center"
              >
                <span
                  className={cn(
                    'size-3 rounded-full border border-primary transition-colors',
                    index === selected ? 'bg-primary' : 'group-hover:bg-primary/40',
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </Carousel>
    </section>
  )
}

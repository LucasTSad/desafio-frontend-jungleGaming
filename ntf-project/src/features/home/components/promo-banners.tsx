import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { NftImage } from '@/components/common/nft-image'
import { Button } from '@/components/ui/button'
import { PROMO_BANNERS } from '../content'

export function PromoBanners() {
  return (
    <section aria-label="Destaques do mercado" className="page-container py-16 lg:py-[70px]">
      <ul className="grid gap-6 lg:grid-cols-2 lg:gap-[30px]">
        {PROMO_BANNERS.map((banner) => (
          <li
            key={banner.title}
            className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] overflow-hidden rounded-xl bg-surface sm:h-[250px] sm:grid-cols-[287px_minmax(0,1fr)]"
          >
            <NftImage
              src={banner.image.src}
              alt={banner.image.alt}
              sizes="(min-width: 640px) 287px, 45vw"
              className="h-full min-h-[200px] rounded-3xl"
            />
            <div className="flex flex-col items-end justify-center gap-3 px-4 py-6 text-right sm:pr-[30px] sm:pl-2">
              <h2 className="max-w-[260px] text-base leading-6 font-bold sm:text-lg">
                {banner.title}
              </h2>
              <p className="max-w-[260px] text-[13px] leading-[22px] text-muted-foreground sm:text-sm">
                {banner.description}
              </p>
              <Button asChild className="mt-1 h-10 w-[140px] text-sm font-medium">
                <Link to="/" search={banner.search} hash="mercado">
                  Explorar
                  <ArrowRight aria-hidden="true" />
                  <span className="sr-only">: {banner.title}</span>
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

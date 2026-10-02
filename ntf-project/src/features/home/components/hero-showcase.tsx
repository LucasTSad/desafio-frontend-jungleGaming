import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import type { NftSummary } from '@/features/catalog/types'
import { useMediaQuery } from '@/lib/use-media-query'

type HeroShowcaseProps = {
  slides: NftSummary[]
}

// Renderiza só a variante do breakpoint atual: as duas têm a imagem de LCP com prioridade
// e não devem disputar o download.
export function HeroShowcase({ slides }: HeroShowcaseProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <DesktopHero slides={slides} /> : <MobileHero slides={slides} />
}

function useCarouselSelection() {
  const [api, setApi] = useState<CarouselApi>()
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    if (!api) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on('select', onSelect)
    api.on('reInit', onSelect)
    return () => {
      api.off('select', onSelect)
      api.off('reInit', onSelect)
    }
  }, [api])

  // Com movimento reduzido a troca de slide é instantânea.
  const scrollTo = (index: number) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    api?.scrollTo(index, reduceMotion)
  }

  return { setApi, selected, scrollTo }
}

function DesktopHero({ slides }: HeroShowcaseProps) {
  const { setApi, selected, scrollTo } = useCarouselSelection()

  return (
    <section
      aria-labelledby="hero-title"
      className="page-container grid grid-cols-[minmax(0,1fr)_auto] gap-8 pt-8 pb-16 lg:pb-24"
    >
      <div className="flex flex-col pt-6 lg:pt-11 lg:pl-10">
        <p className="text-sm tracking-wide">Bem-vindo à Kurio</p>
        <h1
          id="hero-title"
          className="mt-2 text-[32px] leading-[52px] font-bold tracking-wide uppercase lg:text-[44px] lg:leading-[70px]"
        >
          Seja dono do futuro <br />
          da arte digital
        </h1>
        <p className="mt-1 max-w-[557px] text-sm leading-6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Button asChild className="mt-8 h-10 w-[140px] text-base font-bold">
          <a href="#mercado">EXPLORAR</a>
        </Button>
        <SlideDots
          slides={slides}
          selected={selected}
          onSelect={scrollTo}
          className="mt-auto self-end pt-8 pb-6 lg:pr-[70px]"
        />
      </div>

      <HeroCarousel
        slides={slides}
        selected={selected}
        setApi={setApi}
        sizes="(min-width: 1024px) 450px, 300px"
        className="w-[300px] lg:w-[450px]"
        slideClassName="rounded-3xl"
      />
    </section>
  )
}

function MobileHero({ slides }: HeroShowcaseProps) {
  const { setApi, selected, scrollTo } = useCarouselSelection()
  const next = slides[(selected + 1) % slides.length]

  return (
    <section
      aria-labelledby="hero-title-mobile"
      className="relative mx-4 mt-4 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#5e3f25_0%,#805735_42%,#4a301c_72%,#160e0b_100%)] px-[15px] pt-2.5 pb-3"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-[68px] size-[180px] rounded-full bg-[#9a6a41]/25"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-60px] size-[260px] rounded-full border-40 border-[#8a5c37]/20"
      />

      <div className="relative grid grid-cols-[minmax(0,1fr)_130px] gap-3">
        <div className="flex flex-col">
          <p className="text-[11px] tracking-wide">Bem-vindo à Kurio</p>
          <h1
            id="hero-title-mobile"
            className="mt-2 text-[17px] leading-[27px] font-bold tracking-wide uppercase"
          >
            Seja dono da cultura digital
          </h1>
          <p className="mt-2 text-[11px] leading-[17px] tracking-wide">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#mercado"
            className="mt-1.5 flex w-fit items-center gap-2 py-1 text-xs font-bold tracking-wide uppercase"
          >
            Explorar
            <ArrowRight className="size-4 text-brand" aria-hidden="true" />
          </a>
        </div>

        <div className="relative mt-2.5 h-[140px]">
          <HeroCarousel
            slides={slides}
            selected={selected}
            setApi={setApi}
            sizes="130px"
            className="w-[130px]"
            slideClassName="rounded-2xl"
          />
          {next && (
            <NftImage
              src={next.artwork.src}
              alt=""
              sizes="54px"
              className="pointer-events-none absolute -bottom-2 left-3.5 size-[54px] rounded-xl"
            />
          )}
        </div>
      </div>

      <SlideDots
        slides={slides}
        selected={selected}
        onSelect={scrollTo}
        className="relative mt-3 justify-center"
      />
    </section>
  )
}

type HeroCarouselProps = {
  slides: NftSummary[]
  selected: number
  setApi: (api: CarouselApi) => void
  sizes: string
  className?: string
  slideClassName?: string
}

function HeroCarousel({
  slides,
  selected,
  setApi,
  sizes,
  className,
  slideClassName,
}: HeroCarouselProps) {
  // Enquanto os destaques carregam, o espaço da arte fica reservado para não deslocar a página.
  if (slides.length === 0) {
    return <Skeleton className={cn('aspect-square', className, slideClassName)} />
  }

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: true }}
      aria-label="NFTs em destaque"
      className={className}
    >
      <CarouselContent className="-ml-0">
        {slides.map((nft, index) => (
          <CarouselItem
            key={nft.id}
            aria-label={`${index + 1} de ${slides.length}`}
            inert={index !== selected}
            className="pl-0"
          >
            <Link
              to="/nft/$nftId"
              params={{ nftId: nft.id }}
              aria-label={`Ver ${nft.name}`}
              className={cn('block overflow-hidden', slideClassName)}
            >
              <NftImage
                src={nft.artwork.src}
                alt={nft.artwork.alt}
                sizes={sizes}
                priority={index === 0}
                className="aspect-square"
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

type SlideDotsProps = {
  slides: NftSummary[]
  selected: number
  onSelect: (index: number) => void
  className?: string
}

function SlideDots({ slides, selected, onSelect, className }: SlideDotsProps) {
  return (
    <div className={cn('flex', className)}>
      {slides.map((nft, index) => (
        <button
          key={nft.id}
          type="button"
          aria-label={`Mostrar destaque ${index + 1}: ${nft.name}`}
          aria-current={index === selected}
          onClick={() => onSelect(index)}
          className="group flex size-6 items-center justify-center"
        >
          <span
            className={cn(
              'size-2 rounded-full bg-primary transition-opacity',
              index === selected ? 'opacity-100' : 'opacity-45 group-hover:opacity-80',
            )}
          />
        </button>
      ))}
    </div>
  )
}

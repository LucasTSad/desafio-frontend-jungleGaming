import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { type CSSProperties, useState } from 'react'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NftGalleryImage } from '../types'

const focusStyle = (image: NftGalleryImage): CSSProperties | undefined =>
  image.focus
    ? {
        transform: `scale(${image.focus.scale})`,
        transformOrigin: `${image.focus.x}% ${image.focus.y}%`,
      }
    : undefined

type NftGalleryProps = {
  name: string
  images: NftGalleryImage[]
}

export function NftGallery({ name, images }: NftGalleryProps) {
  const [selected, setSelected] = useState(0)
  const current = images[selected] ?? images[0]
  if (!current) return null

  return (
    <div className="flex gap-12">
      <ul aria-label="Imagens do NFT" className="hidden flex-col gap-4 lg:flex">
        {images.map((image, index) => (
          <li key={image.alt}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-current={index === selected}
              onClick={() => setSelected(index)}
              className={cn(
                'block size-[100px] overflow-hidden rounded-lg border-2 transition-colors',
                index === selected ? 'border-primary' : 'border-transparent hover:border-input',
              )}
            >
              <NftImage
                src={image.src}
                alt=""
                sizes="100px"
                className="size-full"
                imgStyle={focusStyle(image)}
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex-1 self-start rounded-lg md:bg-surface md:p-5">
        <NftImage
          src={current.src}
          alt={current.alt}
          sizes="(min-width: 1280px) 404px, (min-width: 768px) 40vw, 100vw"
          priority
          className="aspect-square rounded-3xl"
          imgStyle={focusStyle(current)}
          imgClassName="transition-transform duration-300 motion-reduce:transition-none"
        />
        <GalleryLightbox name={name} images={images} selected={selected} onSelect={setSelected} />
      </div>
    </div>
  )
}

type GalleryLightboxProps = {
  name: string
  images: NftGalleryImage[]
  selected: number
  onSelect: (index: number) => void
}

function GalleryLightbox({ name, images, selected, onSelect }: GalleryLightboxProps) {
  const current = images[selected]
  const go = (step: number) => onSelect((selected + step + images.length) % images.length)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-[#2f1d15] text-foreground transition-colors hover:text-brand md:top-4 md:right-4 md:size-[34px]"
        >
          <Search className="size-5" aria-hidden="true" />
          <span className="sr-only">Ampliar imagem</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[min(92vw,820px)] gap-3 border-border bg-surface p-3 sm:max-w-[min(92vw,820px)] sm:p-4"
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') go(1)
          if (event.key === 'ArrowLeft') go(-1)
        }}
      >
        <DialogTitle className="pr-10 text-base font-semibold">{name}</DialogTitle>
        <DialogDescription className="sr-only">
          Use as setas para navegar entre as imagens.
        </DialogDescription>
        {current && (
          <NftImage
            src={current.src}
            alt={current.alt}
            sizes="(min-width: 900px) 800px, 92vw"
            className="aspect-square max-h-[72vh] w-full rounded-xl"
            imgStyle={focusStyle(current)}
          />
        )}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => go(-1)}
            className="flex size-10 items-center justify-center rounded-full bg-[#2f1d15] hover:text-brand"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
            <span className="sr-only">Imagem anterior</span>
          </button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {selected + 1} de {images.length}
          </p>
          <button
            type="button"
            onClick={() => go(1)}
            className="flex size-10 items-center justify-center rounded-full bg-[#2f1d15] hover:text-brand"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
            <span className="sr-only">Próxima imagem</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

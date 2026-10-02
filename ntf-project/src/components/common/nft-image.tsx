import { cn } from 'cn'
import type { CSSProperties } from 'react'

const WIDTHS = [160, 320, 640, 960] as const

function srcSet(basePath: string, extension: 'avif' | 'webp') {
  return WIDTHS.map((width) => `${basePath}-${width}.${extension} ${width}w`).join(', ')
}

type NftImageProps = {
  /** Caminho base sem largura/extensão, ex.: `/images/nfts/emerald`. */
  src: string
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  imgClassName?: string
  imgStyle?: CSSProperties
}

export function NftImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  imgStyle,
}: NftImageProps) {
  return (
    <picture className={cn('block overflow-hidden', className)}>
      <source type="image/avif" srcSet={srcSet(src, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(src, 'webp')} sizes={sizes} />
      <img
        src={`${src}-640.webp`}
        alt={alt}
        width={640}
        height={640}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className={cn('size-full object-cover', imgClassName)}
        style={imgStyle}
      />
    </picture>
  )
}

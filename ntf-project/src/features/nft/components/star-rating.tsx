import { Star } from 'lucide-react'
import { cn } from 'cn'
import { formatRating } from '../format'

type StarRatingProps = {
  value: number
  className?: string
  starClassName?: string
}

/** Cinco estrelas com preenchimento proporcional à nota (ex.: 4,8 preenche 80% da última). */
export function StarRating({ value, className, starClassName }: StarRatingProps) {
  return (
    <span
      role="img"
      aria-label={`Nota ${formatRating(value)} de 5`}
      className={cn('flex items-center gap-1', className)}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, value - index))
        return (
          <span key={index} className={cn('relative size-[15px]', starClassName)}>
            <Star className="absolute inset-0 size-full fill-muted-foreground/40 stroke-none" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="size-full fill-primary stroke-none" style={{ minWidth: '100%' }} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

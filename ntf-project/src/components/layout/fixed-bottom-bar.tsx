import { useRef, type ComponentProps } from 'react'
import { cn } from 'cn'
import { useFixedBarSpace } from '@/lib/use-fixed-bar-space'

/** Barra presa ao rodapé da tela que reserva o próprio espaço no scroll do foco. */
export function FixedBottomBar({ className, ...props }: ComponentProps<'div'>) {
  const ref = useRef<HTMLDivElement>(null)
  useFixedBarSpace(ref, 'bottom')

  return <div ref={ref} className={cn('fixed inset-x-0 bottom-0', className)} {...props} />
}

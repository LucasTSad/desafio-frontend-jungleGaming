import { useEffect, type RefObject } from 'react'

type Edge = 'top' | 'bottom'

const spaces: Record<Edge, Map<HTMLElement, number>> = { top: new Map(), bottom: new Map() }

function apply(edge: Edge) {
  const space = Math.max(0, ...spaces[edge].values())
  document.documentElement.style.setProperty(`--fixed-${edge}-space`, `${Math.ceil(space)}px`)
}

function measure(bar: HTMLElement, edge: Edge) {
  if (bar.getClientRects().length === 0) return 0
  if (edge === 'top') return bar.offsetHeight
  // Inclui partes que saem da caixa da barra, como o botão central da barra inferior.
  const tops = [bar, ...bar.querySelectorAll('*')].map((el) => el.getBoundingClientRect().top)
  return window.innerHeight - Math.min(...tops)
}

/**
 * Informa ao documento quanto da tela uma barra fixa cobre. O valor vira `scroll-padding`, então o
 * elemento focado pelo teclado (ou um link com âncora) não fica escondido atrás da barra.
 */
export function useFixedBarSpace(ref: RefObject<HTMLElement | null>, edge: Edge) {
  useEffect(() => {
    const bar = ref.current
    if (!bar) return

    const update = () => {
      spaces[edge].set(bar, measure(bar, edge))
      apply(edge)
    }
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    window.addEventListener('resize', update)
    update()

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      spaces[edge].delete(bar)
      apply(edge)
    }
  }, [ref, edge])
}

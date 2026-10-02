import { useRef, type ReactNode } from 'react'
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { useFixedBarSpace } from '@/lib/use-fixed-bar-space'

type MobileTopBarProps = {
  title?: string
  /** Rota usada quando não há histórico para voltar (acesso direto pela URL). */
  fallbackTo?: string
  action?: ReactNode
  /** Use 'p' quando a página já tem o próprio h1 (ex.: seções da conta). */
  titleAs?: 'h1' | 'p'
}

export function MobileTopBar({
  title,
  fallbackTo = '/',
  action,
  titleAs: Title = 'h1',
}: MobileTopBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  useFixedBarSpace(barRef, 'top')
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  function goBack() {
    if (canGoBack) router.history.back()
    else navigate({ to: fallbackTo })
  }

  return (
    <div
      ref={barRef}
      className="sticky top-0 z-30 flex min-h-16 items-center gap-3 bg-background/95 px-4 backdrop-blur md:hidden"
    >
      <button
        type="button"
        onClick={goBack}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand transition-colors hover:bg-accent"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        <span className="sr-only">Voltar</span>
      </button>
      {title ? (
        <Title className="flex-1 py-2 text-center text-lg leading-6 font-bold text-balance">
          {title}
        </Title>
      ) : (
        <span className="flex-1" />
      )}
      <div className="flex size-10 shrink-0 items-center justify-center">{action}</div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'

type MobileTopBarProps = {
  title?: string
  /** Rota usada quando não há histórico para voltar (acesso direto pela URL). */
  fallbackTo?: string
  action?: ReactNode
}

export function MobileTopBar({ title, fallbackTo = '/', action }: MobileTopBarProps) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  function goBack() {
    if (canGoBack) router.history.back()
    else navigate({ to: fallbackTo })
  }

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-background/95 px-4 backdrop-blur md:hidden">
      <button
        type="button"
        onClick={goBack}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-brand transition-colors hover:bg-accent"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
        <span className="sr-only">Voltar</span>
      </button>
      {title ? (
        <h1 className="flex-1 truncate text-center text-lg font-bold">{title}</h1>
      ) : (
        <span className="flex-1" />
      )}
      <div className="flex size-10 shrink-0 items-center justify-center">{action}</div>
    </div>
  )
}

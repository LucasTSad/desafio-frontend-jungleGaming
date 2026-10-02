import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { announce } from '@/lib/announce'
import { getPageTitle } from '@/lib/use-document-title'

/**
 * Depois que a nova página do SPA renderiza, anuncia o título dela e, se o elemento focado saiu da
 * tela junto com a página anterior, leva o foco para o conteúdo principal. Mudanças só de
 * busca/filtros ou de âncora não contam como troca de página.
 */
export function useRouteFocus(mainId: string) {
  const router = useRouter()

  useEffect(() => {
    let frame = 0
    const unsubscribe = router.subscribe('onRendered', (event) => {
      if (!event.fromLocation || !event.pathChanged) return
      cancelAnimationFrame(frame)
      // Espera os efeitos da nova página (como o título da aba) rodarem.
      frame = requestAnimationFrame(() => {
        const active = document.activeElement
        if (!active || active === document.body || !active.isConnected) {
          document.getElementById(mainId)?.focus({ preventScroll: true })
        }
        announce(`Página: ${getPageTitle()}`)
      })
    })
    return () => {
      unsubscribe()
      cancelAnimationFrame(frame)
    }
  }, [router, mainId])
}

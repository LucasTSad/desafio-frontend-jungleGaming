import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { resolveRedirect } from './redirect-search'

/**
 * Leva para o destino original assim que houver sessão (após entrar ou se a pessoa já estiver
 * autenticada). Usa o history porque o destino é um caminho completo, com search e hash.
 */
export function useRedirectWhenSignedIn(signedIn: boolean, redirect: string | undefined) {
  const router = useRouter()

  useEffect(() => {
    if (signedIn) router.history.replace(resolveRedirect(redirect))
  }, [signedIn, redirect, router])
}

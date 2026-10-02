import { redirect } from '@tanstack/react-router'

/** Usado no `beforeLoad` das rotas privadas: sem sessão, leva para Entrar e volta depois. */
export function requireAuth(signedIn: boolean, href: string) {
  if (!signedIn) throw redirect({ to: '/entrar', search: { redirect: href }, replace: true })
}

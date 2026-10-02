import { useMatches } from '@tanstack/react-router'

export type NavSection = 'home' | 'market' | 'creators' | 'learn' | 'account'

export type RouteLayoutOptions = {
  nav?: NavSection
  hideFooter?: boolean
  mobileTabBar?: boolean
  /** A página tem uma barra de ações fixa no rodapé do mobile (ex.: compra no detalhe do NFT). */
  mobileActionBar?: boolean
}

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption extends RouteLayoutOptions {}
}

// A rota mais profunda define a seção ativa do menu e quais partes do layout aparecem.
export function useRouteLayout(): RouteLayoutOptions {
  return useMatches({
    select: (matches) => {
      const options: RouteLayoutOptions = {}
      for (const match of matches) Object.assign(options, match.staticData)
      return options
    },
  })
}

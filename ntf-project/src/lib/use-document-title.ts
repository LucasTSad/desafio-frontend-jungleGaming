import { useEffect } from 'react'

const APP_NAME = 'Kurio'
const HOME_TITLE = 'Início'

let currentPageTitle = HOME_TITLE

/** Mantém o título da aba coerente com a página atual (ex.: "Carrinho | Kurio"). */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    currentPageTitle = title ?? HOME_TITLE
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — Marketplace de NFTs`
  }, [title])
}

/** Nome da página atual sem o sufixo da marca, usado no anúncio de troca de rota. */
export function getPageTitle() {
  return currentPageTitle
}

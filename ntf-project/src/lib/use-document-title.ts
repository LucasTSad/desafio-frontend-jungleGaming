import { useEffect } from 'react'

const APP_NAME = 'Kurio'

/** Mantém o título da aba coerente com a página atual (ex.: "Carrinho | Kurio"). */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} — Marketplace de NFTs`
  }, [title])
}

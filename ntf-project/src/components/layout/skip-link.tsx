export const MAIN_CONTENT_ID = 'conteudo'

export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only z-100 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      Pular para o conteúdo
    </a>
  )
}

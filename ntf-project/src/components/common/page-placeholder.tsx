import { MobileTopBar } from '@/components/layout/mobile-top-bar'

// Marcador provisório das rotas cujas telas são construídas na fase 2.
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <>
      <MobileTopBar title={title} />
      <section className="page-container flex min-h-[50dvh] flex-col items-center justify-center gap-2 py-16 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">Tela em construção.</p>
      </section>
    </>
  )
}

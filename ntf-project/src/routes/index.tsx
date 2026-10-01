import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-3xl font-bold tracking-wide">KURIO</h1>
      <p className="text-muted-foreground">Marketplace de NFTs</p>
    </main>
  )
}

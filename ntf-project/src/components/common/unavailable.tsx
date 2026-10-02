import { Link } from '@tanstack/react-router'
import { Construction } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDocumentTitle } from '@/lib/use-document-title'

type UnavailablePageProps = {
  title: string
  description?: string
}

export function UnavailablePage({ title, description }: UnavailablePageProps) {
  useDocumentTitle(title)

  return (
    <section className="page-container flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-brand">
        <Construction className="size-7" aria-hidden="true" />
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {description ??
            'Esta seção ainda não faz parte da demonstração do marketplace. Explore o catálogo para conhecer os NFTs disponíveis.'}
        </p>
      </div>
      <Button asChild>
        <Link to="/" hash="mercado">
          Explorar o mercado
        </Link>
      </Button>
    </section>
  )
}

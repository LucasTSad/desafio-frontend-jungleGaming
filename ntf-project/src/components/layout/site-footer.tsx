import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { notifyUnavailable } from '@/lib/notify-unavailable'
import {
  FacebookLetterIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
  YoutubeIcon,
} from '@/components/icons/brand-icons'
import { CATALOG_COLLECTIONS, type CollectionSlug } from '@/features/catalog/search-params'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

const FOOTER_COLLECTIONS: CollectionSlug[] = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'utilidade',
]

const HELP_LINKS = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]

const SOCIAL_LINKS = [
  { label: 'Facebook', Icon: FacebookLetterIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X (Twitter)', Icon: XIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

const COLUMNS_GRID = 'lg:grid-cols-[303fr_302fr_303fr_228fr]'

const linkClass =
  'text-left text-sm text-foreground transition-colors hover:text-brand focus-visible:text-brand'

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('page-container pt-16 pb-6 md:pt-24', className)}>
      <div className="overflow-hidden bg-surface">
        <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 md:px-8 lg:grid-cols-[249fr_266fr_265fr_342fr] lg:gap-0 lg:pt-8 lg:pr-[30px] lg:pb-4 lg:pl-12">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.letter}
              className={cn(
                'flex flex-col',
                index > 0 && 'lg:border-l lg:border-primary lg:pl-[17px]',
              )}
            >
              <span
                aria-hidden="true"
                className="flex size-[74px] items-center justify-center rounded-full bg-primary text-[22px] font-bold text-primary-foreground"
              >
                {feature.letter}
              </span>
              <h2 className="mt-3 text-[17px] leading-6 font-semibold">{feature.title}</h2>
              <p className="mt-1.5 max-w-[204px] text-sm leading-[22px] text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
          <NewsletterForm />
        </div>

        <div
          className={cn(
            'grid items-center gap-4 bg-surface-strong px-6 py-6 text-sm sm:grid-cols-2 md:px-8 lg:h-[88px] lg:gap-0 lg:py-0',
            COLUMNS_GRID,
          )}
        >
          <span className="text-[15px] font-bold tracking-[0.08em]">KURIO</span>
          <p className="max-w-60 leading-[22px]">Feito para colecionadores, criadores e cultura</p>
          <a href="mailto:contato@email.com" className="w-fit transition-colors hover:text-brand">
            contato@email.com
          </a>
          <a href="tel:+551140028922" className="w-fit transition-colors hover:text-brand">
            +55 11 4002 8922
          </a>
        </div>

        <div
          className={cn(
            'grid grid-cols-2 gap-8 px-6 pt-7 pb-10 md:grid-cols-4 md:gap-4 md:px-8 lg:gap-0',
            COLUMNS_GRID,
          )}
        >
          <FooterColumn title="Meu perfil">
            <Link to="/conta/perfil" className={linkClass}>
              Meu perfil
            </Link>
            <UnavailableLink label="Minha coleção" />
            <UnavailableLink label="Atividade" />
            <UnavailableLink label="Estúdio do criador" />
            <Link to="/conta/favoritos" className={linkClass}>
              Lista de interesse
            </Link>
          </FooterColumn>

          <FooterColumn title="Central de ajuda">
            {HELP_LINKS.map((label) => (
              <UnavailableLink key={label} label={label} />
            ))}
          </FooterColumn>

          <FooterColumn title="Coleções">
            {FOOTER_COLLECTIONS.map((slug) => (
              <Link
                key={slug}
                to="/"
                search={{ collections: slug }}
                hash="mercado"
                className={linkClass}
              >
                {CATALOG_COLLECTIONS.find((c) => c.slug === slug)?.label}
              </Link>
            ))}
          </FooterColumn>

          <div className="col-span-2 flex flex-col md:col-span-1">
            <h2 className="text-lg leading-7 font-semibold">Redes sociais</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SOCIAL_LINKS.map(({ label, Icon }) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => notifyUnavailable(`O perfil da Kurio no ${label}`)}
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary/15"
                  >
                    <Icon className="size-[18px]" />
                    <span className="sr-only">Kurio no {label}</span>
                  </button>
                </li>
              ))}
            </ul>
            <h2 className="mt-7 text-lg leading-7 font-semibold">Carteiras compatíveis</h2>
            <p className="mt-3 w-fit rounded-sm border border-border bg-surface-strong px-2.5 py-1.5 text-[9px] font-bold tracking-wide text-brand">
              METAMASK&nbsp;&nbsp;•&nbsp;&nbsp;WALLETCONNECT&nbsp;&nbsp;•&nbsp;&nbsp;COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode[] | ReactNode }) {
  const items = Array.isArray(children) ? children.flat() : [children]
  return (
    <div className="flex flex-col">
      <h2 className="text-lg leading-7 font-semibold">{title}</h2>
      <ul className="mt-1 flex flex-col">
        {items.map((child, index) => (
          <li key={index} className="flex min-h-[30px] items-center">
            {child}
          </li>
        ))}
      </ul>
    </div>
  )
}

function UnavailableLink({ label }: { label: string }) {
  return (
    <button type="button" className={linkClass} onClick={() => notifyUnavailable(label)}>
      {label}
    </button>
  )
}

function NewsletterForm() {
  const inputId = useId()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.')
      return
    }
    setError(null)
    notifyUnavailable('A inscrição em alertas de lançamentos')
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex flex-col sm:col-span-2 lg:col-span-1 lg:border-l lg:border-primary lg:pl-[17px]"
    >
      <h2 className="max-w-64 text-lg leading-[18px] font-semibold">
        Antecipe-se ao próximo lançamento
      </h2>
      <div className="mt-[15px] flex">
        <label htmlFor={inputId} className="sr-only">
          E-mail para receber alertas
        </label>
        <input
          id={inputId}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="digite seu e-mail..."
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-10 min-w-0 flex-1 rounded-l-sm border border-r-0 border-transparent bg-surface-strong px-3 text-[15px] outline-none placeholder:text-subtle-foreground focus-visible:border-primary aria-invalid:border-destructive"
        />
        <button
          type="submit"
          className="h-10 rounded-r-sm bg-primary px-4 text-lg font-bold text-primary-foreground transition-colors hover:bg-primary/85"
        >
          Enviar
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <p className="mt-3 text-[13px] leading-[22px] text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
    </form>
  )
}

import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { LogOut, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import type { NavSection } from '@/app/route-layout'

export type HeaderUser = {
  displayName: string
  avatarUrl?: string
}

/** Recebe o foco após entrar pelo dialog, já que o botão Entrar deixa de existir. */
export const ACCOUNT_LINK_ID = 'header-account-link'

type SiteHeaderProps = {
  activeNav?: NavSection
  cartCount: number
  user: HeaderUser | null
  /** Abre o acesso à conta; sem ele, o botão Entrar não aparece. */
  onSignIn?: () => void
}

const NAV_ITEMS = [
  { section: 'home', label: 'Início', to: '/' },
  { section: 'market', label: 'Mercado', to: '/', hash: 'mercado' },
  { section: 'creators', label: 'Criadores', to: '/criadores' },
  { section: 'learn', label: 'Aprenda', to: '/aprenda' },
] as const

export function SiteHeader({ activeNav, cartCount, user, onSignIn }: SiteHeaderProps) {
  return (
    <header className="hidden md:block">
      <div className="page-container">
        <div className="grid h-[69px] grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-border">
          <Link
            to="/"
            className="translate-y-1.5 justify-self-start text-base font-bold"
            aria-label="Kurio, página inicial"
          >
            KURIO
          </Link>

          <nav aria-label="Principal" className="h-full xl:-translate-x-6">
            <ul className="flex h-full items-stretch gap-5 lg:gap-8 xl:gap-10">
              {NAV_ITEMS.map((item) => {
                const active = activeNav === item.section
                return (
                  <li key={item.section} className="flex">
                    <Link
                      to={item.to}
                      hash={'hash' in item ? item.hash : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center text-base transition-colors hover:text-brand',
                        active
                          ? 'font-semibold text-brand after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-primary'
                          : 'text-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex translate-y-1.5 items-center gap-2 justify-self-end">
            <HeaderSearch />
            <Link
              to="/carrinho"
              className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
              aria-label={
                cartCount > 0
                  ? `Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`
                  : 'Carrinho vazio'
              }
            >
              <ShoppingCart className="size-[22px]" strokeWidth={2} aria-hidden="true" />
              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-[9px] right-px flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] leading-none font-bold text-primary-foreground"
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>
            {user ? <AccountLink user={user} /> : onSignIn && <SignInButton onClick={onSignIn} />}
          </div>
        </div>
      </div>
    </header>
  )
}

function SignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className="ml-5 flex h-[34px] items-center gap-1.5 rounded-sm bg-primary px-2.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/85"
    >
      <LogOut className="size-5" strokeWidth={2} aria-hidden="true" />
      Entrar
    </button>
  )
}

function AccountLink({ user }: { user: HeaderUser }) {
  return (
    <Link
      id={ACCOUNT_LINK_ID}
      to="/conta/perfil"
      className="ml-3 flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm transition-colors hover:bg-accent max-lg:pr-1"
    >
      <span className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-surface text-brand">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-4" aria-hidden="true" />
        )}
      </span>
      <span className="max-w-32 truncate max-lg:sr-only">{user.displayName}</span>
      <span className="sr-only">— minha conta</span>
    </Link>
  )
}

function HeaderSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const toggleRef = useRef<HTMLButtonElement>(null)

  function close() {
    setOpen(false)
    toggleRef.current?.focus()
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const q = term.trim()
    navigate({ to: '/', search: q ? { q } : {}, hash: 'mercado' })
    setOpen(false)
  }

  return (
    <div className="flex items-center">
      {open && (
        <form role="search" onSubmit={handleSubmit} className="mr-1">
          <label htmlFor="header-search" className="sr-only">
            Buscar NFTs
          </label>
          <input
            id="header-search"
            autoFocus
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
            }}
            placeholder="Buscar NFTs..."
            className="h-9 w-40 rounded-sm border border-input bg-transparent px-3 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-primary lg:w-56"
          />
        </form>
      )}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls={open ? 'header-search' : undefined}
        aria-label={open ? 'Fechar busca' : 'Abrir busca'}
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-accent"
      >
        {open ? (
          <X className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Search className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

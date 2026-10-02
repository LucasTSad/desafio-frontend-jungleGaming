import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { Heart, House, ScanLine, ShoppingCart, UserRound, type LucideIcon } from 'lucide-react'
import type { NavSection } from '@/app/route-layout'

type MobileTabBarProps = {
  activeNav?: NavSection
  pathname: string
  cartCount: number
}

type TabItem = {
  label: string
  to: '/' | '/conta/favoritos' | '/carrinho' | '/conta/perfil'
  Icon: LucideIcon
  isActive: (pathname: string, activeNav?: NavSection) => boolean
}

const LEFT_TABS: TabItem[] = [
  { label: 'Início', to: '/', Icon: House, isActive: (_, nav) => nav === 'home' },
  {
    label: 'Favoritos',
    to: '/conta/favoritos',
    Icon: Heart,
    isActive: (pathname) => pathname.startsWith('/conta/favoritos'),
  },
]

const RIGHT_TABS: TabItem[] = [
  {
    label: 'Carrinho',
    to: '/carrinho',
    Icon: ShoppingCart,
    isActive: (pathname) => pathname.startsWith('/carrinho'),
  },
  {
    label: 'Perfil',
    to: '/conta/perfil',
    Icon: UserRound,
    isActive: (pathname) =>
      pathname.startsWith('/conta') && !pathname.startsWith('/conta/favoritos'),
  },
]

export function MobileTabBar({ activeNav, pathname, cartCount }: MobileTabBarProps) {
  const renderTab = ({ label, to, Icon, isActive }: TabItem) => {
    const active = isActive(pathname, activeNav)
    const badge = to === '/carrinho' && cartCount > 0 ? cartCount : null
    return (
      <li key={to} className="flex justify-center">
        <Link
          to={to}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'relative flex size-12 items-center justify-center rounded-full transition-colors',
            active ? 'text-brand' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-5" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">
            {label}
            {badge ? `, ${badge} ${badge === 1 ? 'item' : 'itens'}` : ''}
          </span>
          {badge && (
            <span
              aria-hidden="true"
              className="absolute top-2 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative [border-top-left-radius:32px] [border-top-right-radius:32px] bg-surface pt-5">
        <span
          aria-hidden="true"
          className="absolute -top-[45px] left-1/2 size-[90px] -translate-x-1/2 rounded-full bg-background"
        />
        <Link
          to="/"
          hash="mercado"
          className="absolute -top-[30px] left-1/2 z-10 flex size-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dc9c63_0%,#a8703f_100%)] text-foreground shadow-lg shadow-black/30 transition-transform active:scale-95"
        >
          <ScanLine className="size-7" strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only">Explorar coleções</span>
        </Link>
        <ul className="relative grid h-[69px] grid-cols-5 items-start px-3">
          {LEFT_TABS.map(renderTab)}
          <li aria-hidden="true" />
          {RIGHT_TABS.map(renderTab)}
        </ul>
      </div>
    </nav>
  )
}

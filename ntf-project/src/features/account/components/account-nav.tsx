import { Link } from '@tanstack/react-router'
import {
  Activity,
  BadgePercent,
  Download,
  Heart,
  LifeBuoy,
  LogOut,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

type NavItem = {
  label: string
  Icon: LucideIcon
  /** Itens sem rota ficam fora do escopo da demonstração e aparecem como "Em breve". */
  to?: '/conta/perfil' | '/conta/carteiras' | '/conta/favoritos'
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dados do perfil', Icon: UserRound, to: '/conta/perfil' },
  { label: 'Carteiras', Icon: Wallet, to: '/conta/carteiras' },
  { label: 'Atividade', Icon: Activity },
  { label: 'Lista de interesse', Icon: Heart, to: '/conta/favoritos' },
  { label: 'Ofertas', Icon: BadgePercent },
  { label: 'Arquivos baixados', Icon: Download },
  { label: 'Suporte', Icon: LifeBuoy },
]

const ITEM_CLASSES = 'relative flex h-11 w-full items-center gap-3 px-5 text-sm'

type AccountNavProps = {
  onSignOut: () => void
}

export function AccountNav({ onSignOut }: AccountNavProps) {
  return (
    <>
      <nav aria-label="Minha conta" className="hidden self-start bg-surface py-5 md:block">
        <p className="px-5 pb-3 text-base font-bold">Meu perfil</p>
        <ul>
          {NAV_ITEMS.map(({ label, Icon, to }) => (
            <li key={label}>
              {to ? (
                <Link
                  to={to}
                  className={`${ITEM_CLASSES} text-muted-foreground transition-colors hover:text-brand aria-[current=page]:font-semibold aria-[current=page]:text-brand aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-1 aria-[current=page]:before:left-0 aria-[current=page]:before:w-[5px] aria-[current=page]:before:bg-primary`}
                >
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              ) : (
                <span aria-disabled="true" className={`${ITEM_CLASSES} text-subtle-foreground`}>
                  <Icon className="size-[18px] shrink-0" aria-hidden="true" />
                  {label}
                  <span className="ml-auto rounded-full border border-border px-2 py-0.5 text-[11px]">
                    Em breve
                  </span>
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-[#503320] pt-2">
          <SignOutButton
            onSignOut={onSignOut}
            className={`${ITEM_CLASSES} text-muted-foreground transition-colors hover:text-brand`}
          />
        </div>
      </nav>

      <nav aria-label="Minha conta" className="-mx-4 overflow-x-auto px-4 md:hidden">
        <ul className="flex w-max gap-2 pb-1">
          {NAV_ITEMS.map(({ label, Icon, to }) =>
            !to ? null : (
              <li key={label}>
                <Link
                  to={to}
                  className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm whitespace-nowrap text-muted-foreground transition-colors aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary-foreground"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ),
          )}
          <li>
            <SignOutButton
              onSignOut={onSignOut}
              className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm whitespace-nowrap text-muted-foreground"
            />
          </li>
        </ul>
      </nav>
    </>
  )
}

function SignOutButton({ onSignOut, className }: AccountNavProps & { className: string }) {
  return (
    <button type="button" onClick={onSignOut} className={className}>
      <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
      Sair
    </button>
  )
}

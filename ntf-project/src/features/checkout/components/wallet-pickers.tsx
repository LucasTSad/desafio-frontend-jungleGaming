import { Link } from '@tanstack/react-router'
import { EllipsisVertical, Wallet } from 'lucide-react'
import { RadioGroup } from 'radix-ui'
import { useId, type Ref } from 'react'
import { cn } from 'cn'
import {
  CHECKOUT_NETWORKS,
  WALLET_PROVIDERS,
  type SavedWallet,
  type WalletProvider,
} from '../types'
import { RADIO_CLASSES, RADIO_DOT_CLASSES } from './checkout-styles'

type SavedWalletPickerProps = {
  wallets: SavedWallet[]
  value?: string
  onChange: (walletId: string) => void
}

/** "Carteira conectada": carteiras cadastradas na conta, usadas como destino dos NFTs. */
export function SavedWalletPicker({ wallets, value, onChange }: SavedWalletPickerProps) {
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 md:gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id={headingId} className="text-base font-bold">
          Carteira conectada
        </h2>
        <Link to="/conta/carteiras" className="text-base font-bold text-brand hover:underline">
          {wallets.length > 0 ? 'Trocar carteira' : 'Cadastrar carteira'}
        </Link>
      </div>
      {wallets.length === 0 ? (
        <p className="flex items-start gap-3 rounded-md bg-surface p-4 text-[13px] leading-5 text-muted-foreground">
          <Wallet className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          Você ainda não tem carteiras cadastradas. Informe o endereço que vai receber os NFTs nos
          dados do colecionador.
        </p>
      ) : (
        <RadioGroup.Root
          value={value ?? ''}
          onValueChange={onChange}
          aria-labelledby={headingId}
          className="flex flex-col gap-[19px] md:gap-3"
        >
          {wallets.map((wallet) => {
            const itemId = `${headingId}-${wallet.id}`
            const network = CHECKOUT_NETWORKS.find((item) => item.value === wallet.network)
            return (
              <div
                key={wallet.id}
                className="relative flex items-center gap-[18px] rounded-2xl bg-surface py-[18px] pr-3 pl-[18px] has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-primary/50 md:rounded-md md:py-3"
              >
                <RadioGroup.Item
                  id={itemId}
                  value={wallet.id}
                  aria-describedby={`${itemId}-details`}
                  className={cn(RADIO_CLASSES, 'after:absolute after:inset-0 after:rounded-2xl')}
                >
                  <RadioGroup.Indicator className={RADIO_DOT_CLASSES} />
                </RadioGroup.Item>
                <label htmlFor={itemId} className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-bold">{wallet.label}</span>
                  <span
                    id={`${itemId}-details`}
                    className="flex flex-col gap-1 text-[13px] text-muted-foreground"
                  >
                    <span className="truncate">{wallet.displayAddress}</span>
                    <span>{network?.longLabel}</span>
                  </span>
                </label>
                <Link
                  to="/conta/carteiras"
                  className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-subtle-foreground transition-colors hover:bg-accent hover:text-brand"
                >
                  <EllipsisVertical className="size-5" aria-hidden="true" />
                  <span className="sr-only">Gerenciar carteira {wallet.label}</span>
                </Link>
              </div>
            )
          })}
        </RadioGroup.Root>
      )}
    </section>
  )
}

type ProviderPickerProps = {
  value?: WalletProvider
  onChange: (provider: WalletProvider) => void
  error?: string
  /** Recebe o foco quando falta escolher a carteira no envio. */
  firstItemRef?: Ref<HTMLButtonElement>
}

/** "Carteira e rede": o app de carteira que vai assinar o pagamento. */
export function ProviderPicker({ value, onChange, error, firstItemRef }: ProviderPickerProps) {
  const headingId = useId()
  const errorId = `${headingId}-error`

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 md:gap-4">
      <h2 id={headingId} className="text-base font-bold md:text-center">
        Carteira e rede
      </h2>
      <RadioGroup.Root
        value={value ?? ''}
        onValueChange={(next) => onChange(next as WalletProvider)}
        aria-labelledby={headingId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        aria-required
        className="flex flex-col gap-[19px] md:gap-4"
      >
        {WALLET_PROVIDERS.map((provider, index) => {
          const itemId = `${headingId}-${provider.value}`
          return (
            <div
              key={provider.value}
              className="relative flex h-[61px] items-center gap-4 rounded-2xl bg-surface px-[13px] md:h-[45px] md:flex-row-reverse md:justify-end md:rounded-none md:border md:border-input md:bg-transparent md:px-3 md:has-[[data-state=checked]]:border-primary"
            >
              <span
                aria-hidden="true"
                className="flex size-[37px] shrink-0 items-center justify-center rounded-full border border-[#3a2418] bg-[#2f1d15] text-base font-bold text-brand md:hidden"
              >
                {provider.value === 'coinbase' ? <Wallet className="size-5" /> : provider.initial}
              </span>
              <label htmlFor={itemId} className="flex-1 text-[13px] md:text-sm">
                {provider.label}
              </label>
              <RadioGroup.Item
                ref={index === 0 ? firstItemRef : undefined}
                id={itemId}
                value={provider.value}
                aria-invalid={error ? true : undefined}
                className={cn(
                  RADIO_CLASSES,
                  'mr-4 after:absolute after:inset-0 after:rounded-2xl md:mr-0 md:after:rounded-none',
                )}
              >
                <RadioGroup.Indicator className={RADIO_DOT_CLASSES} />
              </RadioGroup.Item>
            </div>
          )
        })}
      </RadioGroup.Root>
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}

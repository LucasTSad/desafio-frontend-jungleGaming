import { Checkbox } from 'radix-ui'
import { useId, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { shortenHex } from '@/features/checkout/format'
import { RADIO_CLASSES, RADIO_DOT_CLASSES } from '@/features/checkout/components/checkout-styles'
import { CHECKOUT_NETWORKS, providerLabel } from '@/features/checkout/types'
import type { WalletInput, WalletValues } from '../schemas'
import type { AccountProfile, AccountWallets, SaveResult, WalletRecord, WalletSlot } from '../types'
import { WalletForm } from './wallet-form'

type WalletsViewProps = {
  profile: AccountProfile
  wallets: AccountWallets
  onSaveWallet: (slot: WalletSlot, values: WalletValues) => Promise<SaveResult<keyof WalletValues>>
  onSetSecondarySame: (same: boolean) => Promise<SaveResult>
}

const SLOT_COPY: Record<WalletSlot, { title: string; name: string }> = {
  principal: { title: 'Carteira principal', name: 'principal' },
  secundaria: { title: 'Carteira secundária', name: 'secundária' },
}

const ACTION_CLASSES =
  'text-base font-bold text-brand transition-colors hover:underline aria-disabled:cursor-not-allowed aria-disabled:text-subtle-foreground aria-disabled:no-underline'

export function WalletsView({
  profile,
  wallets,
  onSaveWallet,
  onSetSecondarySame,
}: WalletsViewProps) {
  const sameId = useId()
  const [savingSame, setSavingSame] = useState(false)
  const secondarySame = Boolean(wallets.principal && wallets.secondaryIsPrincipal)

  async function toggleSame(same: boolean) {
    setSavingSame(true)
    const result = await onSetSecondarySame(same)
    setSavingSame(false)
    if (!result.ok) toast.error(result.message)
    else
      toast.success(
        same
          ? 'A carteira principal também será a secundária.'
          : 'Carteira secundária separada da principal.',
      )
  }

  const sameToggle = (
    <div className="flex items-center gap-2">
      <Checkbox.Root
        id={sameId}
        checked={secondarySame}
        disabled={!wallets.principal || savingSame}
        onCheckedChange={(checked) => void toggleSame(checked === true)}
        aria-describedby={wallets.principal ? undefined : `${sameId}-hint`}
        className={cn(RADIO_CLASSES, 'disabled:opacity-50')}
      >
        <Checkbox.Indicator className={RADIO_DOT_CLASSES} />
      </Checkbox.Root>
      <label htmlFor={sameId} className="text-[13px]">
        Igual à carteira principal
      </label>
      {!wallets.principal && (
        <span id={`${sameId}-hint`} className="sr-only">
          Disponível depois de cadastrar a carteira principal.
        </span>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">Carteiras</h1>
      <WalletSection
        slot="principal"
        description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
        wallet={wallets.principal}
        profile={profile}
        onSave={(values) => onSaveWallet('principal', values)}
      />
      <WalletSection
        slot="secundaria"
        wallet={wallets.secundaria}
        profile={profile}
        headerExtra={sameToggle}
        locked={secondarySame}
        lockedContent={
          wallets.principal && (
            <p className="text-sm text-muted-foreground">
              Usando a mesma carteira da principal: {wallets.principal.nickname} ·{' '}
              {shortenHex(wallets.principal.address)}.
            </p>
          )
        }
        onSave={(values) => onSaveWallet('secundaria', values)}
      />
    </div>
  )
}

type WalletSectionProps = {
  slot: WalletSlot
  description?: string
  wallet?: WalletRecord
  profile: AccountProfile
  headerExtra?: ReactNode
  /** A seção não pode ser editada (ex.: secundária igual à principal). */
  locked?: boolean
  lockedContent?: ReactNode
  onSave: (values: WalletValues) => Promise<SaveResult<keyof WalletValues>>
}

function WalletSection({
  slot,
  description,
  wallet,
  profile,
  headerExtra,
  locked = false,
  lockedContent,
  onSave,
}: WalletSectionProps) {
  const headingId = useId()
  const actionRef = useRef<HTMLButtonElement>(null)
  // A principal começa com o formulário aberto quando ainda não existe, como no Figma.
  const [editing, setEditing] = useState(slot === 'principal' && !wallet)
  const [openedByAction, setOpenedByAction] = useState(false)
  const copy = SLOT_COPY[slot]
  const showForm = editing && !locked

  function closeForm() {
    setEditing(false)
    setOpenedByAction(false)
    requestAnimationFrame(() => actionRef.current?.focus())
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id={headingId} className="text-base font-bold">
            {copy.title}
          </h2>
          {description && <p className="mt-1 text-xs text-subtle-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-4">
          {headerExtra}
          {!showForm && (
            <button
              ref={actionRef}
              type="button"
              aria-disabled={locked || undefined}
              onClick={() => {
                if (locked) return
                setEditing(true)
                setOpenedByAction(true)
              }}
              className={ACTION_CLASSES}
            >
              {wallet ? 'Editar' : 'Adicionar'}
              <span className="sr-only"> carteira {copy.name}</span>
            </button>
          )}
        </div>
      </div>

      {locked ? (
        lockedContent
      ) : showForm ? (
        <WalletForm
          autoFocus={openedByAction}
          defaultValues={wallet ?? emptyWallet(profile)}
          onCancel={wallet || slot === 'secundaria' ? closeForm : undefined}
          onSave={async (values) => {
            const result = await onSave(values)
            if (result.ok) {
              toast.success(`Carteira ${copy.name} salva.`)
              closeForm()
            }
            return result
          }}
        />
      ) : wallet ? (
        <WalletSummary wallet={wallet} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Você ainda não adicionou uma carteira {copy.name}.
        </p>
      )}
    </section>
  )
}

function emptyWallet(profile: AccountProfile): Partial<WalletInput> {
  return {
    nickname: '',
    displayName: profile.displayName,
    profileName: '',
    address: '',
    secondaryWallet: '',
    referralCode: '',
    email: profile.email,
    ensName: profile.ensName,
  }
}

function WalletSummary({ wallet }: { wallet: WalletRecord }) {
  const network = CHECKOUT_NETWORKS.find((item) => item.value === wallet.network)
  const rows = [
    { label: 'Rede', value: network?.longLabel },
    { label: 'Endereço', value: wallet.address, mono: true },
    { label: 'Tipo de carteira', value: providerLabel(wallet.walletType) },
    { label: 'Nome ENS', value: `${wallet.ensName}.eth` },
    { label: 'Nome do perfil', value: wallet.profileName },
    { label: 'E-mail', value: wallet.email },
  ]

  return (
    <div className="rounded-md bg-surface p-5">
      <p className="text-[15px] font-bold">{wallet.nickname}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-subtle-foreground">{row.label}</dt>
            <dd className={cn('text-muted-foreground', row.mono && 'break-all')}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { ChevronDown, CircleAlert, ShoppingCart } from 'lucide-react'
import { Accordion } from 'radix-ui'
import { useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { StatusMessage } from '@/components/common/status-message'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { PageBreadcrumbs } from '@/components/layout/page-breadcrumbs'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/features/catalog/format'
import type { CatalogStatus } from '@/features/catalog/types'
import type { AppliedCoupon, CartLine, CartTotals } from '@/features/cart/types'
import { announce } from '@/lib/announce'
import { useMediaQuery } from '@/lib/use-media-query'
import { checkoutSchema, type CheckoutInput, type CheckoutValues } from '../schemas'
import type { CheckoutQuote, PaymentResult, SavedWallet, WalletProvider } from '../types'
import { CheckoutItems, CheckoutTotals } from './checkout-summary'
import { CollectorFields } from './collector-fields'
import { ReviewDialog, type PayRequest } from './review-dialog'
import { ProviderPicker, SavedWalletPicker } from './wallet-pickers'

type CheckoutViewProps = {
  status: CatalogStatus
  lines: CartLine[]
  totals: CartTotals
  coupon?: AppliedCoupon
  savedWallets: SavedWallet[]
  defaultValues: Partial<CheckoutInput>
  onPay: (values: CheckoutValues, request: PayRequest) => Promise<PaymentResult>
  onPlaced: (orderId: string) => void
  onRetry: () => void
}

export function CheckoutView(props: CheckoutViewProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  return (
    <>
      <MobileTopBar title="Pagamento com carteira" fallbackTo="/carrinho" />
      <div className="page-container pt-2 pb-[136px] md:pt-5 md:pb-24">
        <PageBreadcrumbs
          items={[
            { label: 'Início', link: { to: '/' } },
            { label: 'Mercado', link: { to: '/', hash: 'mercado' } },
            { label: 'Pagamento' },
          ]}
        />
        <h1 className="sr-only max-md:hidden">Pagamento</h1>
        <CheckoutContent {...props} isDesktop={isDesktop} />
      </div>
    </>
  )
}

const FIELD_ORDER = [
  'displayName',
  'username',
  'network',
  'profileName',
  'walletAddress',
  'secondaryWallet',
  'walletType',
  'referralCode',
  'email',
  'ensName',
  'note',
  'provider',
] as const

function CheckoutContent({
  status,
  lines,
  totals,
  coupon,
  savedWallets,
  defaultValues,
  onPay,
  onPlaced,
  onRetry,
  isDesktop,
}: CheckoutViewProps & { isDesktop: boolean }) {
  const formId = useId()
  const blockedId = useId()
  const providerRef = useRef<HTMLButtonElement>(null)
  const [openSections, setOpenSections] = useState<string[]>([])
  const [review, setReview] = useState<{ values: CheckoutValues; quote: CheckoutQuote }>()
  const form = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues,
    shouldFocusError: false,
  })
  const { control, setValue, setFocus, handleSubmit, formState } = form
  const [walletSource, savedWalletId, provider] = useWatch({
    control,
    name: ['walletSource', 'savedWalletId', 'provider'],
  })

  if (status === 'loading') return <CheckoutSkeleton />
  if (status === 'error') {
    return (
      <StatusMessage
        role="alert"
        className="mt-6"
        icon={<CircleAlert className="size-7" aria-hidden="true" />}
        title="Não foi possível carregar o pagamento"
        description="Verifique sua conexão e tente novamente. Seus itens continuam no carrinho."
        action={<Button onClick={onRetry}>Tentar novamente</Button>}
      />
    )
  }
  if (lines.length === 0) {
    return (
      <StatusMessage
        className="mt-6"
        icon={<ShoppingCart className="size-7" aria-hidden="true" />}
        title="Não há itens para pagar"
        description="Adicione NFTs ao carrinho para finalizar uma compra."
        action={
          <Button asChild>
            <Link to="/" hash="mercado">
              Explorar o mercado
            </Link>
          </Button>
        }
      />
    )
  }

  const selectedWallet = savedWallets.find((wallet) => wallet.id === savedWalletId)
  const lockedWallet = walletSource === 'saved' ? selectedWallet : undefined
  const blocked = lines.some((line) => line.status?.kind === 'unavailable')
  const validateOnChange = formState.isSubmitted

  function applySavedWallet(wallet: SavedWallet) {
    const options = { shouldValidate: validateOnChange, shouldDirty: true }
    setValue('walletSource', 'saved')
    setValue('savedWalletId', wallet.id)
    setValue('network', wallet.network, options)
    setValue('walletAddress', wallet.address, options)
    setValue('walletType', wallet.provider, options)
    setValue('provider', wallet.provider, options)
  }

  function changeWalletSource(useOther: boolean) {
    if (!useOther) {
      const wallet = selectedWallet ?? savedWallets[0]
      if (wallet) applySavedWallet(wallet)
      return
    }
    setValue('walletSource', 'other')
    setValue('walletAddress', '', { shouldValidate: validateOnChange })
    requestAnimationFrame(() => setFocus('walletAddress'))
  }

  function focusFirstError(errors: FieldErrors<CheckoutInput>) {
    const first = FIELD_ORDER.find((name) => errors[name])
    if (!first) return
    const count = FIELD_ORDER.filter((name) => errors[name]).length
    announce(`Revise ${count === 1 ? 'o campo destacado' : `os ${count} campos destacados`}.`)
    if (first !== 'provider' && !isDesktop) {
      setOpenSections((current) =>
        current.includes('collector') ? current : [...current, 'collector'],
      )
    }
    // Espera o acordeão do mobile montar os campos antes de mover o foco e, depois da animação
    // de abertura, centraliza o campo para ele não ficar atrás da barra fixa de confirmação.
    setTimeout(() => {
      if (first === 'provider') providerRef.current?.focus()
      else setFocus(first)
      setTimeout(() => document.activeElement?.scrollIntoView({ block: 'center' }), 250)
    }, 50)
  }

  const billableLines = lines.filter((line) => line.status?.kind !== 'unavailable')
  const openReview = (values: CheckoutValues) =>
    setReview({ values, quote: { lines: billableLines, totals } })

  const collectorFields = (
    <CollectorFields
      form={form}
      savedWallet={lockedWallet}
      hasSavedWallets={savedWallets.length > 0}
      onUseOtherWalletChange={changeWalletSource}
    />
  )
  const walletPickers = (
    <>
      <SavedWalletPicker
        wallets={savedWallets}
        value={walletSource === 'saved' ? savedWalletId : undefined}
        onChange={(id) => {
          const wallet = savedWallets.find((item) => item.id === id)
          if (wallet) applySavedWallet(wallet)
        }}
      />
      <ProviderPicker
        value={provider}
        onChange={(next: WalletProvider) =>
          setValue('provider', next, { shouldValidate: validateOnChange })
        }
        error={formState.errors.provider?.message}
        firstItemRef={providerRef}
      />
    </>
  )
  const blockedNotice = blocked && (
    <p
      id={blockedId}
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
    >
      Há itens indisponíveis no carrinho.{' '}
      <Link to="/carrinho" className="font-semibold underline">
        Revise o carrinho
      </Link>{' '}
      antes de pagar.
    </p>
  )
  const confirmProps = {
    type: 'submit' as const,
    form: formId,
    'aria-disabled': blocked || undefined,
    'aria-describedby': blocked ? blockedId : undefined,
    onClick: (event: MouseEvent) => blocked && event.preventDefault(),
  }

  return (
    <>
      <form
        id={formId}
        onSubmit={(event) => void handleSubmit(openReview, focusFirstError)(event)}
        noValidate
        className="mt-2 md:mt-5"
      >
        {isDesktop ? (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,763px)_minmax(0,405px)] lg:justify-between lg:gap-8">
            <section aria-labelledby={`${formId}-collector`}>
              <h2 id={`${formId}-collector`} className="text-base font-bold">
                Perfil do colecionador
              </h2>
              <p className="mt-1 mb-4 text-xs text-subtle-foreground">
                Campos com <span className="text-destructive">*</span> são obrigatórios.
              </p>
              {collectorFields}
            </section>
            <aside aria-label="Resumo da compra" className="flex flex-col gap-5">
              <section aria-labelledby={`${formId}-items`} className="flex flex-col gap-3">
                <h2 id={`${formId}-items`} className="text-base font-bold">
                  Seus NFTs
                </h2>
                <CheckoutItems lines={billableLines} />
              </section>
              <CheckoutTotals totals={totals} coupon={coupon} showPromoLink />
              {walletPickers}
              {blockedNotice}
              <Button {...confirmProps} className="h-[45px] w-full text-base font-bold">
                Confirmar compra
              </Button>
            </aside>
          </div>
        ) : (
          <div className="flex flex-col gap-[26px]">
            {walletPickers}
            <Accordion.Root
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="flex flex-col gap-3"
            >
              <MobileSection value="collector" title="Dados do colecionador">
                <p className="mb-4 text-xs text-subtle-foreground">
                  Campos com <span className="text-destructive">*</span> são obrigatórios.
                </p>
                {collectorFields}
              </MobileSection>
              <MobileSection value="summary" title={`Resumo do pedido (${billableLines.length})`}>
                <CheckoutItems lines={billableLines} compact />
                <div className="mt-4">
                  <CheckoutTotals totals={totals} coupon={coupon} showPromoLink />
                </div>
              </MobileSection>
            </Accordion.Root>
            {blockedNotice}
            <p className="flex items-baseline justify-end gap-6 text-lg font-bold">
              Total:
              <span className="text-brand">{formatEth(totals.totalEth)}</span>
            </p>
          </div>
        )}
      </form>

      {!isDesktop && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-background/95 px-[26px] pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Button
            {...confirmProps}
            variant="gradient"
            size="pill"
            className="h-14 w-full font-bold"
          >
            Confirmar compra
          </Button>
        </div>
      )}

      {review && (
        <ReviewDialog
          open
          onOpenChange={(open) => !open && setReview(undefined)}
          values={review.values}
          quote={review.quote}
          coupon={coupon}
          onPay={(request) => onPay(review.values, request)}
          onPlaced={onPlaced}
        />
      )}
    </>
  )
}

function MobileSection({
  value,
  title,
  children,
}: {
  value: string
  title: string
  children: ReactNode
}) {
  return (
    <Accordion.Item value={value} className="rounded-2xl bg-surface">
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between gap-3 rounded-2xl px-[18px] py-4 text-left text-base font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          {title}
          <ChevronDown
            className="size-5 text-brand transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-[18px] pb-5">{children}</Accordion.Content>
    </Accordion.Item>
  )
}

function CheckoutSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mt-5 grid gap-12 lg:grid-cols-[minmax(0,763px)_minmax(0,405px)] lg:justify-between"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-1/3" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[70px] w-full" />
        ))}
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-[45px] w-full" />
      </div>
    </div>
  )
}

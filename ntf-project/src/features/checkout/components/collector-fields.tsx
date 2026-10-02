import { Checkbox } from 'radix-ui'
import { useId } from 'react'
import { Controller, useWatch, type UseFormReturn } from 'react-hook-form'
import { cn } from 'cn'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { NOTE_MAX_LENGTH, type CheckoutInput, type CheckoutValues } from '../schemas'
import type { SavedWallet } from '../types'
import { CHECKOUT_LABEL_CLASSES, RADIO_CLASSES, RADIO_DOT_CLASSES } from './checkout-styles'
import { EnsNameInput, NetworkSelect, WalletTypeSelect } from './wallet-field-controls'

type CollectorFieldsProps = {
  form: UseFormReturn<CheckoutInput, unknown, CheckoutValues>
  /** Carteira cadastrada em uso; os campos de carteira ficam travados com os dados dela. */
  savedWallet?: SavedWallet
  /** Sem carteiras cadastradas, a opção "Usar outra carteira?" não faz sentido e some. */
  hasSavedWallets: boolean
  onUseOtherWalletChange: (useOther: boolean) => void
}

export function CollectorFields({
  form,
  savedWallet,
  hasSavedWallets,
  onUseOtherWalletChange,
}: CollectorFieldsProps) {
  const otherWalletId = useId()
  const noteCounterId = useId()
  const {
    register,
    control,
    formState: { errors },
  } = form
  const locked = Boolean(savedWallet)
  const noteLength = useWatch({ control, name: 'note' })?.length ?? 0
  const lockedHint = savedWallet
    ? `Da carteira ${savedWallet.label} cadastrada. Marque "Usar outra carteira?" para informar outra.`
    : undefined

  return (
    <div className="grid gap-x-6 gap-y-[26px] md:grid-cols-2">
      <FormField
        label="Nome de exibição"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.displayName?.message}
      >
        {(field) => <Input {...field} {...register('displayName')} autoComplete="name" />}
      </FormField>
      <FormField
        label="Nome de usuário"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.username?.message}
      >
        {(field) => (
          <Input
            {...field}
            {...register('username')}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </FormField>

      <FormField
        label="Rede"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.network?.message}
      >
        {(field) => (
          <Controller
            control={control}
            name="network"
            render={({ field: { value, onChange, ref } }) => (
              <NetworkSelect
                {...field}
                ref={ref}
                value={value}
                onChange={onChange}
                disabled={locked}
              />
            )}
          />
        )}
      </FormField>
      <FormField
        label="Nome do perfil"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.profileName?.message}
      >
        {(field) => <Input {...field} {...register('profileName')} />}
      </FormField>

      <FormField
        label="Endereço da carteira"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        hint={lockedHint}
        error={errors.walletAddress?.message}
      >
        {(field) => (
          <Input
            {...field}
            {...register('walletAddress')}
            readOnly={locked}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Endereço 0x da carteira"
            className={cn('px-[22px]', locked && 'text-muted-foreground')}
          />
        )}
      </FormField>
      <FormField
        label="Carteira secundária (opcional)"
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.secondaryWallet?.message}
      >
        {(field) => (
          <Input
            {...field}
            {...register('secondaryWallet')}
            autoCapitalize="none"
            spellCheck={false}
            placeholder="ENS ou carteira secundária (opcional)"
            className="px-[22px]"
          />
        )}
      </FormField>

      <FormField
        label="Tipo de carteira"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.walletType?.message}
      >
        {(field) => (
          <Controller
            control={control}
            name="walletType"
            render={({ field: { value, onChange, ref } }) => (
              <WalletTypeSelect
                {...field}
                ref={ref}
                value={value}
                onChange={onChange}
                disabled={locked}
              />
            )}
          />
        )}
      </FormField>
      <FormField
        label="Código de indicação"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.referralCode?.message}
      >
        {(field) => (
          <Input
            {...field}
            {...register('referralCode')}
            autoCapitalize="characters"
            spellCheck={false}
          />
        )}
      </FormField>

      <FormField
        label="E-mail"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.email?.message}
      >
        {(field) => (
          <Input
            {...field}
            {...register('email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        )}
      </FormField>
      <FormField
        label="Nome ENS"
        required
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.ensName?.message}
      >
        {(field) => <EnsNameInput {...field} {...register('ensName')} />}
      </FormField>

      {hasSavedWallets && (
        <div className="flex items-center gap-2 md:col-span-2">
          <Controller
            control={control}
            name="walletSource"
            render={({ field: { value, ref } }) => (
              <Checkbox.Root
                ref={ref}
                id={otherWalletId}
                checked={value === 'other'}
                onCheckedChange={(checked) => onUseOtherWalletChange(checked === true)}
                className={RADIO_CLASSES}
              >
                <Checkbox.Indicator className={RADIO_DOT_CLASSES} />
              </Checkbox.Root>
            )}
          />
          <label htmlFor={otherWalletId} className="text-[15px]">
            Usar outra carteira?
          </label>
        </div>
      )}

      <FormField
        label="Observação do colecionador (opcional)"
        labelClassName={CHECKOUT_LABEL_CLASSES}
        error={errors.note?.message}
        className="md:col-span-2 md:max-w-[350px]"
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <Textarea
              {...field}
              {...register('note')}
              aria-describedby={[field['aria-describedby'], noteCounterId]
                .filter(Boolean)
                .join(' ')}
              maxLength={NOTE_MAX_LENGTH}
              className="[field-sizing:fixed] h-[152px] resize-none rounded-none"
            />
            <p id={noteCounterId} className="self-end text-xs text-subtle-foreground">
              {noteLength}/{NOTE_MAX_LENGTH} caracteres
            </p>
          </div>
        )}
      </FormField>
    </div>
  )
}

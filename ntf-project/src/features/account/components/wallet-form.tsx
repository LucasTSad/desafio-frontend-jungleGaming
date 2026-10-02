import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { FormField } from '@/components/common/form-field'
import { FormAlert, SubmitButton } from '@/components/common/form-status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHECKOUT_LABEL_CLASSES } from '@/features/checkout/components/checkout-styles'
import {
  EnsNameInput,
  NetworkSelect,
  WalletTypeSelect,
} from '@/features/checkout/components/wallet-field-controls'
import { announce } from '@/lib/announce'
import { walletSchema, type WalletInput, type WalletValues } from '../schemas'
import type { SaveResult } from '../types'

type WalletFormProps = {
  defaultValues: Partial<WalletInput>
  onSave: (values: WalletValues) => Promise<SaveResult<keyof WalletValues>>
  /** Sem `onCancel` o formulário é o único conteúdo da seção (nenhuma carteira cadastrada). */
  onCancel?: () => void
  /** Move o foco para o primeiro campo quando o formulário é aberto por um botão. */
  autoFocus?: boolean
}

const FIELD_ORDER = [
  'displayName',
  'nickname',
  'network',
  'profileName',
  'address',
  'secondaryWallet',
  'walletType',
  'referralCode',
  'email',
  'ensName',
] as const

export function WalletForm({ defaultValues, onSave, onCancel, autoFocus }: WalletFormProps) {
  const [formError, setFormError] = useState<string>()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<WalletInput, unknown, WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues,
    shouldFocusError: false,
  })

  useEffect(() => {
    if (autoFocus) setFocus('displayName')
  }, [autoFocus, setFocus])

  function focusFirstError(fieldErrors: FieldErrors<WalletInput>) {
    const first = FIELD_ORDER.find((name) => fieldErrors[name])
    if (!first) return
    const count = FIELD_ORDER.filter((name) => fieldErrors[name]).length
    announce(`Revise ${count === 1 ? 'o campo destacado' : `os ${count} campos destacados`}.`)
    setFocus(first)
  }

  async function save(values: WalletValues) {
    setFormError(undefined)
    const result = await onSave(values)
    if (result.ok) return
    if (result.field) setError(result.field, { message: result.message }, { shouldFocus: true })
    else setFormError(result.message)
  }

  return (
    <form
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void handleSubmit(save, focusFirstError)(event)
      }}
      noValidate
      aria-busy={isSubmitting}
      className="flex flex-col gap-6"
    >
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
          label="Apelido da carteira"
          required
          labelClassName={CHECKOUT_LABEL_CLASSES}
          error={errors.nickname?.message}
        >
          {(field) => <Input {...field} {...register('nickname')} />}
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
                <NetworkSelect {...field} ref={ref} value={value} onChange={onChange} />
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
          error={errors.address?.message}
        >
          {(field) => (
            <Input
              {...field}
              {...register('address')}
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Endereço 0x da carteira"
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
                <WalletTypeSelect {...field} ref={ref} value={value} onChange={onChange} />
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
      </div>

      <FormAlert message={formError} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SubmitButton
          pending={isSubmitting}
          label="Salvar carteira"
          pendingLabel="Salvando…"
          className="md:w-auto md:px-5"
        />
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="h-[45px] text-muted-foreground"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

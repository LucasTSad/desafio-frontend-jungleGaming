import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { toast } from 'sonner'
import { FormField } from '@/components/common/form-field'
import { FormAlert, SubmitButton } from '@/components/common/form-status'
import { PasswordInput } from '@/components/common/password-input'
import { Input } from '@/components/ui/input'
import { EnsNameInput } from '@/features/checkout/components/wallet-field-controls'
import { announce } from '@/lib/announce'
import { PASSWORD_RULES_HINT } from '@/lib/form-validators'
import { profileSchema, type ProfileInput, type ProfileValues } from '../schemas'
import type { AccountProfile, SaveResult } from '../types'
import { AvatarField } from './avatar-field'
import { CHECKOUT_LABEL_CLASSES } from '@/features/checkout/components/checkout-styles'

type ProfileFormProps = {
  profile: AccountProfile
  onSave: (
    values: ProfileValues,
    avatarUrl: string | undefined,
  ) => Promise<SaveResult<keyof ProfileValues>>
}

const FIELD_ORDER = [
  'displayName',
  'username',
  'email',
  'ensName',
  'walletNickname',
  'currentPassword',
  'newPassword',
  'confirmPassword',
] as const

const toFormValues = (profile: AccountProfile): ProfileInput => ({
  displayName: profile.displayName,
  username: profile.username,
  email: profile.email,
  ensName: profile.ensName,
  walletNickname: profile.walletNickname,
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const headingId = useId()
  const passwordHeadingId = useId()
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [formError, setFormError] = useState<string>()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
    shouldFocusError: false,
  })

  function focusFirstError(fieldErrors: FieldErrors<ProfileInput>) {
    const first = FIELD_ORDER.find((name) => fieldErrors[name])
    if (!first) return
    const count = FIELD_ORDER.filter((name) => fieldErrors[name]).length
    announce(`Revise ${count === 1 ? 'o campo destacado' : `os ${count} campos destacados`}.`)
    setFocus(first)
  }

  async function save(values: ProfileValues) {
    setFormError(undefined)
    const result = await onSave(values, avatarUrl)
    if (!result.ok) {
      if (result.field) setError(result.field, { message: result.message }, { shouldFocus: true })
      else setFormError(result.message)
      return
    }
    reset({ ...values, currentPassword: '', newPassword: '', confirmPassword: '' })
    toast.success(values.newPassword ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
  }

  return (
    <form
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void handleSubmit(save, focusFirstError)(event)
      }}
      noValidate
      aria-busy={isSubmitting}
      aria-labelledby={headingId}
      className="flex flex-col gap-8"
    >
      <section className="flex flex-col gap-4">
        <div>
          <h1 id={headingId} className="text-base font-bold">
            Perfil do colecionador
          </h1>
          <p className="mt-1 text-xs text-subtle-foreground">
            Campos com <span className="text-destructive">*</span> são obrigatórios.
          </p>
        </div>
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
            labelClassName={CHECKOUT_LABEL_CLASSES}
            hint="Opcional."
            error={errors.ensName?.message}
          >
            {(field) => <EnsNameInput {...field} {...register('ensName')} />}
          </FormField>
          <FormField
            label="Apelido da carteira"
            required
            labelClassName={CHECKOUT_LABEL_CLASSES}
            error={errors.walletNickname?.message}
          >
            {(field) => <Input {...field} {...register('walletNickname')} />}
          </FormField>
          <AvatarField value={avatarUrl} onChange={setAvatarUrl} />
        </div>
      </section>

      <section aria-labelledby={passwordHeadingId} className="flex flex-col gap-4">
        <div>
          <h2 id={passwordHeadingId} className="text-base font-bold">
            Alterar senha
          </h2>
          <p className="mt-1 text-xs text-subtle-foreground">
            Preencha apenas se quiser trocar a senha.
          </p>
        </div>
        <div className="grid gap-y-[26px] md:max-w-[calc(50%-0.75rem)]">
          <FormField
            label="Senha atual"
            labelClassName={CHECKOUT_LABEL_CLASSES}
            error={errors.currentPassword?.message}
          >
            {(field) => (
              <PasswordInput
                {...field}
                {...register('currentPassword')}
                autoComplete="current-password"
              />
            )}
          </FormField>
          <FormField
            label="Nova senha"
            labelClassName={CHECKOUT_LABEL_CLASSES}
            hint={PASSWORD_RULES_HINT}
            error={errors.newPassword?.message}
          >
            {(field) => (
              <PasswordInput {...field} {...register('newPassword')} autoComplete="new-password" />
            )}
          </FormField>
          <FormField
            label="Confirmar nova senha"
            labelClassName={CHECKOUT_LABEL_CLASSES}
            error={errors.confirmPassword?.message}
          >
            {(field) => (
              <PasswordInput
                {...field}
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
            )}
          </FormField>
        </div>
      </section>

      <div className="flex flex-col gap-3 md:max-w-[calc(50%-0.75rem)]">
        <FormAlert message={formError} />
        <SubmitButton
          pending={isSubmitting}
          label="Salvar"
          pendingLabel="Salvando…"
          className="md:w-[130px]"
        />
      </div>
    </form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/common/form-field'
import { PasswordInput } from '@/components/common/password-input'
import { Input } from '@/components/ui/input'
import { PASSWORD_HINT, signUpSchema, type SignUpInput, type SignUpValues } from '../schemas'
import { AUTH_COPY, type AuthSubmitResult } from '../types'
import { FormAlert, SubmitButton } from '@/components/common/form-status'
import { AUTH_INPUT_CLASSES } from './auth-styles'

type SignUpFormProps = {
  onSubmit: (values: SignUpValues) => Promise<AuthSubmitResult<keyof SignUpValues>>
  /** Texto do botão de envio; o mobile do Figma usa "Criar perfil". */
  submitLabel?: ReactNode
}

export function SignUpForm({
  onSubmit,
  submitLabel = AUTH_COPY['sign-up'].submit,
}: SignUpFormProps) {
  const [formError, setFormError] = useState<string>()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput, unknown, SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const submit = handleSubmit(async (values) => {
    setFormError(undefined)
    const result = await onSubmit(values)
    if (result.ok) return
    if (result.field) setError(result.field, { message: result.message }, { shouldFocus: true })
    else setFormError(result.message)
  })

  return (
    <form
      onSubmit={(event) => {
        if (isSubmitting) event.preventDefault()
        else void submit(event)
      }}
      noValidate
      aria-busy={isSubmitting}
      className="flex flex-col"
    >
      <div className="flex flex-col gap-3">
        <FormField label="Nome de usuário" hideLabel error={errors.username?.message}>
          {(control) => (
            <Input
              {...control}
              {...register('username')}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Nome de usuário"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
        <FormField label="E-mail" hideLabel error={errors.email?.message}>
          {(control) => (
            <Input
              {...control}
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Digite seu e-mail"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
        <FormField label="Senha" hideLabel hint={PASSWORD_HINT} error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...register('password')}
              autoComplete="new-password"
              placeholder="Senha"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
        <FormField label="Confirmar senha" hideLabel error={errors.confirmPassword?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...register('confirmPassword')}
              autoComplete="new-password"
              placeholder="Confirmar senha"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
      </div>

      <div className="mt-[42px] flex flex-col gap-3 md:mt-6">
        <FormAlert message={formError} />
        <SubmitButton
          pending={isSubmitting}
          label={submitLabel}
          pendingLabel={AUTH_COPY['sign-up'].pending}
        />
      </div>
    </form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/common/form-field'
import { PasswordInput } from '@/components/common/password-input'
import { Input } from '@/components/ui/input'
import { notifyUnavailable } from '@/lib/notify-unavailable'
import { signInSchema, type SignInInput, type SignInValues } from '../schemas'
import { AUTH_COPY, type AuthSubmitResult } from '../types'
import { FormAlert, SubmitButton } from '@/components/common/form-status'
import { AUTH_INPUT_CLASSES } from './auth-styles'

type SignInFormProps = {
  onSubmit: (values: SignInValues) => Promise<AuthSubmitResult<keyof SignInValues>>
}

export function SignInForm({ onSubmit }: SignInFormProps) {
  const [formError, setFormError] = useState<string>()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput, unknown, SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
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
              placeholder="contato@email.com"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
        <FormField label="Senha" hideLabel error={errors.password?.message}>
          {(control) => (
            <PasswordInput
              {...control}
              {...register('password')}
              autoComplete="current-password"
              placeholder="Senha"
              className={AUTH_INPUT_CLASSES}
            />
          )}
        </FormField>
      </div>

      <button
        type="button"
        onClick={() => notifyUnavailable('A recuperação de senha')}
        className="mt-2.5 self-end text-[15px] text-brand hover:underline md:text-sm"
      >
        Esqueceu a senha?
      </button>

      <div className="mt-8 flex flex-col gap-3 md:mt-[22px]">
        <FormAlert message={formError} />
        <SubmitButton
          pending={isSubmitting}
          label={AUTH_COPY['sign-in'].submit}
          pendingLabel={AUTH_COPY['sign-in'].pending}
        />
      </div>
    </form>
  )
}

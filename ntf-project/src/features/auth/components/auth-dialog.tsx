import { X } from 'lucide-react'
import { Tabs } from 'radix-ui'
import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SignInValues, SignUpValues } from '../schemas'
import { AUTH_COPY, type AuthMode, type AuthSubmitResult } from '../types'
import { SocialSignIn } from './auth-form-parts'
import { AUTH_TAB_CLASSES } from './auth-styles'
import { SignInForm } from './sign-in-form'
import { SignUpForm } from './sign-up-form'

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignIn: (values: SignInValues) => Promise<AuthSubmitResult<keyof SignInValues>>
  onSignUp: (values: SignUpValues) => Promise<AuthSubmitResult<keyof SignUpValues>>
  /**
   * Permite levar o foco para outro lugar ao fechar (ex.: a conta, após entrar). Sem
   * preventDefault, o foco volta para o elemento que abriu o dialog.
   */
  onCloseAutoFocus?: (event: Event) => void
}

export function AuthDialog({
  open,
  onOpenChange,
  onSignIn,
  onSignUp,
  onCloseAutoFocus,
}: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Centralizado por layout, não por transform, para o texto não borrar em meio pixel. */}
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          const firstField = (event.currentTarget as HTMLElement | null)?.querySelector('input')
          if (!firstField) return
          event.preventDefault()
          firstField.focus()
        }}
        onCloseAutoFocus={onCloseAutoFocus}
        className="inset-x-0 top-[max(1rem,calc(50dvh-18.75rem))] mx-auto max-h-[calc(100dvh-2rem)] max-w-[500px] translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-md border-b-[10px] border-primary bg-surface p-0 text-foreground ring-0 sm:max-w-[500px]"
      >
        <DialogTitle className="sr-only">Acesse sua conta Kurio</DialogTitle>
        <DialogClose className="absolute top-1 right-1.5 flex size-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-accent">
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Fechar</span>
        </DialogClose>
        <AuthDialogBody onSignIn={onSignIn} onSignUp={onSignUp} />
      </DialogContent>
    </Dialog>
  )
}

function AuthDialogBody({ onSignIn, onSignUp }: Pick<AuthDialogProps, 'onSignIn' | 'onSignUp'>) {
  const [mode, setMode] = useState<AuthMode>('sign-in')

  return (
    <Tabs.Root
      value={mode}
      onValueChange={(next) => setMode(next as AuthMode)}
      className="px-20 pt-[47px] pb-16"
    >
      <Tabs.List aria-label="Acesso à conta" className="flex justify-center">
        {(['sign-in', 'sign-up'] as const).map((value) => (
          <Tabs.Trigger key={value} value={value} className={AUTH_TAB_CLASSES}>
            {AUTH_COPY[value].tab}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <Tabs.Content value="sign-in" className="pb-7 outline-none">
        <DialogDescription className="-mx-[30px] mt-10 text-center text-[13px] leading-4 text-foreground">
          {AUTH_COPY['sign-in'].description}
        </DialogDescription>
        <div className="mt-6">
          <SignInForm onSubmit={onSignIn} />
        </div>
        <SocialSignIn className="mt-6" />
      </Tabs.Content>
      <Tabs.Content value="sign-up" className="outline-none">
        <DialogDescription className="-mx-[30px] mt-10 text-center text-[13px] leading-4 text-foreground">
          {AUTH_COPY['sign-up'].description}
        </DialogDescription>
        <div className="mt-6">
          <SignUpForm onSubmit={onSignUp} />
        </div>
        <SocialSignIn className="mt-6" />
      </Tabs.Content>
    </Tabs.Root>
  )
}

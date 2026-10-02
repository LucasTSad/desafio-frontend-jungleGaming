import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'
import { AUTH_COPY, type AuthMode } from '../types'
import { SocialSignIn } from './auth-form-parts'
import { AUTH_TAB_CLASSES } from './auth-styles'

type AuthScreenProps = {
  mode: AuthMode
  redirect?: string
  children: ReactNode
}

/** Versão em página das telas de acesso: tela cheia no mobile e cartão centralizado no desktop. */
export function AuthScreen({ mode, redirect, children }: AuthScreenProps) {
  const copy = AUTH_COPY[mode]
  const other: AuthMode = mode === 'sign-in' ? 'sign-up' : 'sign-in'

  return (
    <>
      <MobileTopBar fallbackTo="/" />
      <div className="px-[26px] pb-12 md:px-4 md:py-16">
        <div className="mx-auto flex max-w-[400px] flex-col md:max-w-[500px] md:rounded-md md:border-b-[10px] md:border-primary md:bg-surface md:px-20 md:pt-[47px] md:pb-16">
          <Link
            to="/"
            aria-label="Kurio, página inicial"
            className="mt-[60px] self-center text-[32px] leading-none font-bold tracking-[0.06em] md:hidden"
          >
            KURIO
          </Link>
          <h1 className="mt-20 text-center text-lg font-bold md:sr-only">{copy.title}</h1>

          <nav aria-label="Acesso à conta" className="hidden justify-center md:flex">
            <Link to="/entrar" search={{ redirect }} className={AUTH_TAB_CLASSES}>
              {AUTH_COPY['sign-in'].tab}
            </Link>
            <Link to="/cadastro" search={{ redirect }} className={AUTH_TAB_CLASSES}>
              {AUTH_COPY['sign-up'].tab}
            </Link>
          </nav>
          <p className="text-center text-[13px] leading-4 max-md:sr-only md:-mx-[30px] md:mt-10">
            {copy.description}
          </p>

          <div className="mt-8 md:mt-6">{children}</div>
          <SocialSignIn className="mt-9 md:mt-6" />

          <p className="mt-9 text-center text-[15px] text-muted-foreground md:hidden">
            {copy.switchPrompt}{' '}
            <Link
              to={other === 'sign-in' ? '/entrar' : '/cadastro'}
              search={{ redirect }}
              className="text-brand underline underline-offset-4"
            >
              {copy.switchAction}
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}

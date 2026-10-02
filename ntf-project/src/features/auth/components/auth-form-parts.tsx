import type { ReactNode } from 'react'
import { cn } from 'cn'
import { LoaderCircle } from 'lucide-react'
import { FacebookLetterIcon, GoogleIcon } from '@/components/icons/brand-icons'
import { Button } from '@/components/ui/button'
import { notifyUnavailable } from '@/lib/notify-unavailable'

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {message}
    </p>
  )
}

type SubmitButtonProps = {
  pending: boolean
  label: ReactNode
  pendingLabel: string
  className?: string
}

export function SubmitButton({ pending, label, pendingLabel, className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      aria-disabled={pending || undefined}
      className={cn(
        'h-[57px] w-full rounded-[10px] text-base font-bold md:h-[45px] md:rounded-sm',
        className,
      )}
    >
      {pending && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}

const SOCIAL_PROVIDERS = [
  { name: 'Google', Icon: GoogleIcon, iconClassName: 'size-5' },
  { name: 'Facebook', Icon: FacebookLetterIcon, iconClassName: 'size-5 text-[#3b5999]' },
] as const

/** Login social fica fora do escopo: os botões avisam a indisponibilidade em vez de simular sucesso. */
export function SocialSignIn({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className="flex items-center gap-4 text-[13px] md:-mx-20">
        <span aria-hidden="true" className="h-px flex-1 bg-input" />
        Ou continue com
        <span aria-hidden="true" className="h-px flex-1 bg-input" />
      </p>
      <ul className="flex flex-col gap-3">
        {SOCIAL_PROVIDERS.map(({ name, Icon, iconClassName }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => notifyUnavailable(`O login com ${name}`)}
              className="flex h-[37px] w-full items-center justify-center gap-3 rounded-sm border border-input text-[15px] text-muted-foreground transition-colors hover:border-primary/60 hover:bg-accent md:h-10 md:text-[13px]"
            >
              <Icon className={iconClassName} />
              Continuar com {name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

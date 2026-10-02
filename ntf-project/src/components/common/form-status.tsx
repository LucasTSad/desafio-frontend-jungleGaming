import type { ReactNode } from 'react'
import { cn } from 'cn'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

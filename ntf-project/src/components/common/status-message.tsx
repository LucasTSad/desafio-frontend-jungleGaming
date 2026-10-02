import type { ReactNode } from 'react'
import { cn } from 'cn'

type StatusMessageProps = {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  role?: 'alert' | 'status'
  /** `h1` quando a mensagem ocupa a página inteira (ex.: NFT não encontrado). */
  titleAs?: 'p' | 'h1' | 'h2'
  className?: string
}

/** Bloco padrão para estados vazios, de erro e de "não encontrado". */
export function StatusMessage({
  icon,
  title,
  description,
  action,
  role,
  titleAs: Title = 'p',
  className,
}: StatusMessageProps) {
  return (
    <div
      role={role}
      className={cn(
        'flex min-h-80 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-surface text-brand">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <Title className="text-lg font-semibold">{title}</Title>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

import { useId, type ReactNode } from 'react'
import { cn } from 'cn'

export type FieldControlProps = {
  id: string
  'aria-invalid'?: true
  'aria-required'?: true
  'aria-describedby'?: string
}

type FormFieldProps = {
  label: string
  /** Mantém o rótulo apenas para leitores de tela quando o layout usa só placeholder. */
  hideLabel?: boolean
  /** Mostra o asterisco do layout e marca o controle como obrigatório. */
  required?: boolean
  hint?: string
  error?: string
  className?: string
  labelClassName?: string
  children: (control: FieldControlProps) => ReactNode
}

export function FormField({
  label,
  hideLabel = false,
  required = false,
  hint,
  error,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={cn('text-sm font-semibold', hideLabel && 'sr-only', labelClassName)}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-required': required ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className={cn('text-xs text-subtle-foreground', error && 'sr-only')}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

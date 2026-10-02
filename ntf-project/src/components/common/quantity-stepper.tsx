import { Minus, Plus } from 'lucide-react'
import { cn } from 'cn'

type StepperVariant = 'pill' | 'compact' | 'circle' | 'ghost'

type QuantityStepperProps = {
  value: number
  max: number
  min?: number
  onChange: (value: number) => void
  /** Nome do item, usado nos rótulos acessíveis ("Quantidade de Emerald Ape #042"). */
  itemLabel: string
  variant?: StepperVariant
  className?: string
}

const BUTTON_VARIANTS: Record<StepperVariant, string> = {
  pill: 'h-12 w-8 rounded-full bg-primary text-primary-foreground hover:brightness-110',
  compact: 'h-8 w-6 rounded-full bg-primary text-primary-foreground hover:brightness-110',
  circle: 'size-6 rounded-full bg-primary text-primary-foreground hover:brightness-110',
  ghost: 'size-[30px] rounded-full bg-[#2f1d15] text-foreground hover:bg-surface-strong',
}

const VALUE_VARIANTS: Record<StepperVariant, string> = {
  pill: 'min-w-8 text-lg',
  compact: 'min-w-7 text-lg',
  circle: 'min-w-6 text-base',
  ghost: 'min-w-7 text-base',
}

export function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  itemLabel,
  variant = 'pill',
  className,
}: QuantityStepperProps) {
  const buttonClass = cn(
    'flex shrink-0 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-35',
    BUTTON_VARIANTS[variant],
  )
  const iconClass = variant === 'circle' ? 'size-3.5 stroke-3' : 'size-4 stroke-[2.5]'

  return (
    <div
      role="group"
      aria-label={`Quantidade de ${itemLabel}`}
      className={cn('flex items-center gap-2', className)}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus className={iconClass} aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className={cn('text-center tabular-nums', VALUE_VARIANTS[variant])}
      >
        {value}
      </output>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={value >= max ? `Aumentar quantidade (limite de ${max})` : 'Aumentar quantidade'}
      >
        <Plus className={iconClass} aria-hidden="true" />
      </button>
    </div>
  )
}

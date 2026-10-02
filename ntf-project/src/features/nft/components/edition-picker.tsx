import { RadioGroup } from 'radix-ui'
import { useId } from 'react'
import { cn } from 'cn'
import type { EditionId, NftEdition } from '../types'

type EditionPickerProps = {
  editions: NftEdition[]
  value: EditionId
  onChange: (edition: EditionId) => void
  className?: string
}

export function EditionPicker({ editions, value, onChange, className }: EditionPickerProps) {
  const labelId = useId()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p id={labelId} className="text-[15px] font-bold">
        Edição:
      </p>
      <RadioGroup.Root
        aria-labelledby={labelId}
        value={value}
        onValueChange={(next) => onChange(next as EditionId)}
        orientation="horizontal"
        className="flex flex-wrap gap-2.5"
      >
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          return (
            <RadioGroup.Item
              key={edition.id}
              value={edition.id}
              disabled={soldOut}
              aria-label={soldOut ? `${edition.label}, esgotada` : edition.label}
              title={soldOut ? 'Edição esgotada' : undefined}
              className={cn(
                'h-[26px] rounded-full border border-input px-2 text-sm text-muted-foreground transition-colors',
                'hover:border-primary hover:text-brand data-[state=checked]:border-brand data-[state=checked]:font-semibold data-[state=checked]:text-brand',
                'disabled:cursor-not-allowed disabled:text-muted-foreground/45 disabled:line-through disabled:hover:border-input',
              )}
            >
              {edition.label}
            </RadioGroup.Item>
          )
        })}
      </RadioGroup.Root>
    </div>
  )
}

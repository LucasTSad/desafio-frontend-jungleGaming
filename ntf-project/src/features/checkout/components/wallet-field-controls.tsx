import type { ComponentProps, Ref } from 'react'
import { cn } from 'cn'
import type { FieldControlProps } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CHECKOUT_NETWORKS,
  WALLET_PROVIDERS,
  type CheckoutNetwork,
  type WalletProvider,
} from '../types'

// Controles de carteira compartilhados entre o pagamento e a página de carteiras da conta.

const SELECT_TRIGGER_CLASSES = 'h-10 w-full rounded-sm px-3 data-placeholder:text-subtle-foreground'

type OptionSelectProps<TValue extends string> = FieldControlProps & {
  value?: TValue
  onChange: (value: TValue) => void
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
}

function OptionSelect<TValue extends string>({
  value,
  onChange,
  disabled,
  ref,
  placeholder,
  options,
  ...field
}: OptionSelectProps<TValue> & {
  placeholder: string
  options: readonly { value: TValue; label: string }[]
}) {
  return (
    <Select
      value={value ?? ''}
      onValueChange={(next) => onChange(next as TValue)}
      disabled={disabled}
    >
      <SelectTrigger {...field} ref={ref} className={SELECT_TRIGGER_CLASSES}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function NetworkSelect(props: OptionSelectProps<CheckoutNetwork>) {
  return <OptionSelect {...props} placeholder="Selecione uma rede" options={CHECKOUT_NETWORKS} />
}

export function WalletTypeSelect(props: OptionSelectProps<WalletProvider>) {
  return <OptionSelect {...props} placeholder="Selecione uma carteira" options={WALLET_PROVIDERS} />
}

/** Campo do nome ENS com o sufixo ".eth" fixo ao lado. */
export function EnsNameInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <div className="flex">
      <Input
        {...props}
        autoCapitalize="none"
        spellCheck={false}
        className={cn('rounded-r-none', className)}
      />
      <span
        aria-hidden="true"
        className="flex h-10 items-center rounded-r-sm border border-l-0 border-input px-3 text-base"
      >
        .eth
      </span>
    </div>
  )
}

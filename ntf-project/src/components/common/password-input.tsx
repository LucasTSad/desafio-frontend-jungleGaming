import { useState, type ComponentProps } from 'react'
import { cn } from 'cn'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function PasswordInput({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        spellCheck={false}
        autoCapitalize="none"
        className={cn('pr-12', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        aria-label="Mostrar senha"
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-sm text-subtle-foreground transition-colors hover:text-brand focus-visible:text-brand focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
      >
        {visible ? (
          <Eye className="size-5" aria-hidden="true" />
        ) : (
          <EyeOff className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  )
}

import { LoaderCircle, UserRound } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AVATAR_ACCEPT, AVATAR_RULES_HINT, prepareAvatar } from '../avatar'

type AvatarFieldProps = {
  value?: string
  onChange: (avatarUrl: string | undefined) => void
}

export function AvatarField({ value, onChange }: AvatarFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const changeRef = useRef<HTMLButtonElement>(null)
  const [error, setError] = useState<string>()
  const [processing, setProcessing] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProcessing(true)
    const result = await prepareAvatar(file)
    setProcessing(false)
    if (result.ok) {
      setError(undefined)
      onChange(result.dataUrl)
    } else {
      setError(result.message)
    }
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-1.5">
      <p id={`${id}-label`} className="text-[15px]">
        Avatar
      </p>
      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-brand ring-1 ring-border">
          {value ? (
            <img src={value} alt="Avatar atual" className="size-full object-cover" />
          ) : (
            <UserRound className="size-6" aria-hidden="true" />
          )}
        </span>
        <input
          ref={inputRef}
          id={`${id}-file`}
          type="file"
          accept={AVATAR_ACCEPT}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => {
            void handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />
        <Button
          ref={changeRef}
          type="button"
          size="sm"
          aria-describedby={`${id}-hint ${error ? `${id}-error` : ''}`.trim()}
          aria-disabled={processing || undefined}
          onClick={() => {
            if (!processing) inputRef.current?.click()
          }}
          className="h-9 px-4"
        >
          {processing && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {processing ? 'Processando…' : 'Alterar'}
          <span className="sr-only"> avatar</span>
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => {
              setError(undefined)
              onChange(undefined)
              changeRef.current?.focus()
            }}
            className="text-sm text-muted-foreground transition-colors hover:text-brand"
          >
            Remover<span className="sr-only"> avatar</span>
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="text-xs text-subtle-foreground">
        {AVATAR_RULES_HINT} A nova foto é aplicada ao salvar.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

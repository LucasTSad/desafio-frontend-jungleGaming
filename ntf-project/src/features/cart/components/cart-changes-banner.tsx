import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/features/catalog/format'
import type { CartLine } from '../types'

type CartChangesBannerProps = {
  lines: CartLine[]
  onAcceptPrices: (lines: CartLine[]) => void
}

/**
 * Resume as mudanças de preço e disponibilidade. Preço novo só vale depois que a pessoa confirma,
 * e até lá o checkout fica bloqueado.
 */
export function CartChangesBanner({ lines, onAcceptPrices }: CartChangesBannerProps) {
  const changed = lines.filter((line) => line.status)
  const repriced = changed.filter((line) => line.status?.kind === 'price-changed')
  if (changed.length === 0) return null

  return (
    <div
      role="status"
      className="flex gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
    >
      <RefreshCw className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold">Atualizamos seu carrinho</p>
        <ul className="flex flex-col gap-0.5 text-muted-foreground">
          {changed.map((line) => (
            <li key={line.id}>
              {line.status?.kind === 'unavailable'
                ? `${line.name} (${line.edition.label}) ficou indisponível.`
                : `${line.name}: o preço mudou de ${formatEth(
                    line.status?.kind === 'price-changed' ? line.status.previousPriceEth : '0',
                  )} para ${formatEth(line.unitPriceEth)}.`}
            </li>
          ))}
        </ul>
        {repriced.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAcceptPrices(repriced)}
            className="mt-2 w-fit"
          >
            {repriced.length === 1 ? 'Aceitar novo preço' : 'Aceitar novos preços'}
          </Button>
        )}
      </div>
    </div>
  )
}

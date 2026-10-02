import { RefreshCw } from 'lucide-react'
import { formatEth } from '@/features/catalog/format'
import type { CartLine } from '../types'

/** Resume as mudanças de preço e disponibilidade recebidas enquanto o carrinho estava aberto. */
export function CartChangesBanner({ lines }: { lines: CartLine[] }) {
  const changed = lines.filter((line) => line.status)
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
                    line.status?.kind === 'price-changed' ? line.status.previousPriceEth : 0,
                  )} para ${formatEth(line.unitPriceEth)}.`}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

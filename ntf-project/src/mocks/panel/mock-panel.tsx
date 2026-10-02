import { FlaskConical } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useId, useState } from 'react'
import { mockControl } from '../control'
import { SCENARIOS, type ScenarioId } from '../scenarios'

const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

/**
 * Painel da demonstração para trocar o cenário da API simulada e restaurar os dados iniciais.
 * Fica acima das barras fixas do mobile e, em desenvolvimento, acima do botão dos devtools.
 */
export function MockPanel() {
  const selectId = useId()
  const descriptionId = useId()
  const [active] = useState(mockControl.getScenario)
  const [selected, setSelected] = useState<ScenarioId>(active)

  function apply() {
    mockControl.setScenario(selected)
    window.location.reload()
  }

  function reset() {
    mockControl.reset({ scenario: selected })
    window.location.reload()
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className="fixed left-3 z-60 flex items-center gap-1.5 rounded-full border border-border bg-surface-strong px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg shadow-black/40 transition-colors hover:bg-accent"
        style={{
          bottom: `calc(var(--fixed-bottom-space, 0px) + ${import.meta.env.DEV ? 60 : 12}px)`,
        }}
      >
        <FlaskConical className="size-3.5 text-brand" aria-hidden="true" />
        <span>
          <span className="sr-only">API simulada, cenário: </span>
          {SCENARIOS[active].label}
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-60 flex w-[min(320px,calc(100vw-24px))] flex-col gap-3 rounded-md border border-border bg-surface p-4 text-sm text-foreground shadow-xl shadow-black/50"
        >
          <div>
            <p className="font-bold">API simulada (MSW)</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Escolha um cenário para reproduzir falhas e estados da interface.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={selectId} className="text-xs font-semibold">
              Cenário
            </label>
            <select
              id={selectId}
              value={selected}
              aria-describedby={descriptionId}
              onChange={(event) => setSelected(event.target.value as ScenarioId)}
              className="h-9 rounded-sm border border-input bg-background px-2 text-sm"
            >
              {SCENARIO_IDS.map((id) => (
                <option key={id} value={id}>
                  {SCENARIOS[id].label}
                </option>
              ))}
            </select>
            <p id={descriptionId} className="text-xs text-muted-foreground">
              {SCENARIOS[selected].description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={apply}
              disabled={selected === active}
              className="h-9 flex-1 rounded-sm bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aplicar cenário
            </button>
            <button
              type="button"
              onClick={reset}
              className="h-9 flex-1 rounded-sm border border-primary px-3 text-sm font-bold text-brand transition-colors hover:bg-accent"
            >
              Restaurar dados
            </button>
          </div>
          <p className="text-[11px] text-subtle-foreground">
            "Restaurar dados" volta às fixtures com o cenário selecionado e encerra a sessão. A
            página recarrega nos dois casos.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

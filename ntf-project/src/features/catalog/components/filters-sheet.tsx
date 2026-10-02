import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

type FiltersSheetProps = {
  trigger: ReactNode
  resultCount: number
  children: ReactNode
}

export function FiltersSheet({ trigger, resultCount, children }: FiltersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[88%] gap-0 border-border bg-surface sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-lg">Filtros</SheetTitle>
          <SheetDescription className="sr-only">
            Os filtros são aplicados ao catálogo assim que selecionados.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
        <SheetFooter className="border-t border-border px-5 py-4">
          <SheetClose asChild>
            <Button className="w-full">
              Ver {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { UnavailablePage } from '@/components/common/unavailable'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'

export const Route = createFileRoute('/criadores')({
  staticData: { nav: 'creators' },
  component: CreatorsPage,
})

function CreatorsPage() {
  return (
    <>
      <MobileTopBar />
      <UnavailablePage title="Criadores" />
    </>
  )
}

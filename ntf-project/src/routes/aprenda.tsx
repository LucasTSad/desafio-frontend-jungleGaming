import { createFileRoute } from '@tanstack/react-router'
import { UnavailablePage } from '@/components/common/unavailable'
import { MobileTopBar } from '@/components/layout/mobile-top-bar'

export const Route = createFileRoute('/aprenda')({
  staticData: { nav: 'learn' },
  component: LearnPage,
})

function LearnPage() {
  return (
    <>
      <MobileTopBar />
      <UnavailablePage title="Aprenda" />
    </>
  )
}

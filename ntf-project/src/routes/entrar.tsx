import { createFileRoute } from '@tanstack/react-router'
import { PagePlaceholder } from '@/components/common/page-placeholder'
import { redirectSearchSchema } from '@/features/auth/redirect-search'

export const Route = createFileRoute('/entrar')({
  validateSearch: redirectSearchSchema,
  component: () => <PagePlaceholder title="Entrar" />,
})

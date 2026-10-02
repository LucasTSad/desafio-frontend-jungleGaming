import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { previewAuth, usePreviewUser } from '@/dev/preview-session'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { SignUpForm } from '@/features/auth/components/sign-up-form'
import { welcomeMessage } from '@/features/auth/messages'
import { redirectSearchSchema } from '@/features/auth/redirect-search'
import { useRedirectWhenSignedIn } from '@/features/auth/use-redirect-when-signed-in'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/cadastro')({
  validateSearch: redirectSearchSchema,
  staticData: { hideFooter: true, hideSignIn: true },
  component: SignUpPage,
})

function SignUpPage() {
  const { redirect } = Route.useSearch()
  const user = usePreviewUser()

  useDocumentTitle('Criar conta')
  useRedirectWhenSignedIn(Boolean(user), redirect)

  if (user) return null

  return (
    <AuthScreen mode="sign-up" redirect={redirect}>
      <SignUpForm
        submitLabel={
          <>
            <span className="md:hidden">Criar perfil</span>
            <span className="hidden md:inline">Criar conta</span>
          </>
        }
        onSubmit={async (values) => {
          const result = await previewAuth.signUp(values)
          if (result.ok) toast.success(welcomeMessage('sign-up', result.displayName))
          return result
        }}
      />
    </AuthScreen>
  )
}

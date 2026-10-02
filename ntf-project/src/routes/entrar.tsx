import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { previewAuth, usePreviewUser } from '@/dev/preview-session'
import { AuthScreen } from '@/features/auth/components/auth-screen'
import { SignInForm } from '@/features/auth/components/sign-in-form'
import { welcomeMessage } from '@/features/auth/messages'
import { redirectSearchSchema } from '@/features/auth/redirect-search'
import { useRedirectWhenSignedIn } from '@/features/auth/use-redirect-when-signed-in'
import { useDocumentTitle } from '@/lib/use-document-title'

export const Route = createFileRoute('/entrar')({
  validateSearch: redirectSearchSchema,
  staticData: { hideFooter: true, hideSignIn: true },
  component: SignInPage,
})

function SignInPage() {
  const { redirect } = Route.useSearch()
  const user = usePreviewUser()

  useDocumentTitle('Entrar')
  useRedirectWhenSignedIn(Boolean(user), redirect)

  if (user) return null

  return (
    <AuthScreen mode="sign-in" redirect={redirect}>
      <SignInForm
        onSubmit={async (values) => {
          const result = await previewAuth.signIn(values)
          if (result.ok) toast.success(welcomeMessage('sign-in', result.displayName))
          return result
        }}
      />
    </AuthScreen>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useSignIn } from '@/features/auth/api'
import { useSessionUser } from '@/features/auth/session'
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
  const user = useSessionUser()
  const signIn = useSignIn()

  useDocumentTitle('Entrar')
  useRedirectWhenSignedIn(Boolean(user), redirect)

  if (user) return null

  return (
    <AuthScreen mode="sign-in" redirect={redirect}>
      <SignInForm
        onSubmit={async (values) => {
          const result = await signIn(values)
          if (result.ok) toast.success(welcomeMessage('sign-in', result.displayName))
          return result
        }}
      />
    </AuthScreen>
  )
}

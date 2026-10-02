export type AuthMode = 'sign-in' | 'sign-up'

/** Resultado do envio: em caso de falha, `field` indica o campo que recebe a mensagem. */
export type AuthSubmitResult<TField extends string = string> =
  { ok: true; displayName: string } | { ok: false; message: string; field?: TField }

export const AUTH_COPY: Record<
  AuthMode,
  {
    tab: string
    title: string
    description: string
    submit: string
    pending: string
    switchPrompt: string
    switchAction: string
  }
> = {
  'sign-in': {
    tab: 'Entrar',
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    submit: 'Entrar',
    pending: 'Entrando…',
    switchPrompt: 'Novo na Kurio?',
    switchAction: 'Crie uma conta',
  },
  'sign-up': {
    tab: 'Criar conta',
    title: 'Criar perfil de colecionador',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    submit: 'Criar conta',
    pending: 'Criando conta…',
    switchPrompt: 'Já tem uma conta?',
    switchAction: 'Entre',
  },
}

/** Credenciais fictícias das contas de demonstração (as fixtures do mock guardam só o hash). */
export const ACCOUNTS = {
  colecionador: {
    email: 'colecionador@kurio.dev',
    password: 'Kurio2026',
    salt: 'c0l3c10n4d0r-s4lt',
  },
  curadora: { email: 'curadora@kurio.dev', password: 'Curadoria2026', salt: 'cur4d0r4-s4lt' },
} as const

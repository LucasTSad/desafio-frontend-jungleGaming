interface ImportMetaEnv {
  /** "enabled" liga os mocks do MSW (desenvolvimento e build de demonstração). */
  readonly VITE_API_MOCKING?: 'enabled' | 'disabled'
  /** Base da API REST. Padrão: /api/v1 na mesma origem. */
  readonly VITE_API_URL?: string
  /** Origem do Socket.IO. Padrão: a mesma origem da página. */
  readonly VITE_SOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

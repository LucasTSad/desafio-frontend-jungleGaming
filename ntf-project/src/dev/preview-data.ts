// Dados de exemplo temporários para validar as telas contra o Figma.
// Este arquivo será removido quando a API (MSW) for integrada.

import type { HeaderUser } from '@/components/layout/site-header'

export const previewSession: { user: HeaderUser | null; cartCount: number } = {
  user: null,
  cartCount: 6,
}

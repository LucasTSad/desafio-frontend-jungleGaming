export const GUEST_CART_STORAGE_KEY = 'kurio-cart-id'

let memoryId: string | null = null
const listeners = new Set<() => void>()

export function subscribeGuestCart(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const notify = () => {
  for (const listener of listeners) listener()
}

/** Id do carrinho do visitante, ou `null` enquanto ele ainda não adicionou nada. */
export function getGuestCartId(): string | null {
  try {
    return localStorage.getItem(GUEST_CART_STORAGE_KEY)
  } catch {
    return memoryId
  }
}

/** Cria o id só no primeiro item adicionado, para não abrir carrinhos vazios na API. */
export function ensureGuestCartId(): string {
  const existing = getGuestCartId()
  if (existing) return existing
  const id = crypto.randomUUID()
  memoryId = id
  try {
    localStorage.setItem(GUEST_CART_STORAGE_KEY, id)
  } catch {
    // Sem storage, o carrinho do visitante vale só até recarregar a página.
  }
  notify()
  return id
}

/** Depois de juntar ao carrinho da conta, o carrinho do visitante deixa de existir. */
export function clearGuestCartId() {
  memoryId = null
  try {
    localStorage.removeItem(GUEST_CART_STORAGE_KEY)
  } catch {
    // Nada a limpar.
  }
  notify()
}

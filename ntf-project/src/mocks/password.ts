/** Hash SHA-256 de "salt:senha" em hexadecimal. O mock nunca guarda a senha em claro. */
export async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  return (await hashPassword(password, salt)) === expectedHash
}

export function createSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

export const AVATAR_ACCEPT = 'image/png,image/jpeg,image/webp'
export const AVATAR_RULES_HINT = 'PNG, JPG ou WebP com até 5 MB e pelo menos 96 × 96 px.'

const ACCEPTED_TYPES = new Set(AVATAR_ACCEPT.split(','))
const MAX_BYTES = 5 * 1024 * 1024
const MIN_SIDE = 96
const OUTPUT_SIDE = 256

export type AvatarResult = { ok: true; dataUrl: string } | { ok: false; message: string }

/**
 * Valida a imagem escolhida e gera o avatar final: recorte quadrado central
 * redimensionado para 256 px em WebP, evitando enviar a foto original inteira.
 */
export async function prepareAvatar(file: File): Promise<AvatarResult> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    return { ok: false, message: 'Formato não suportado. Envie uma imagem PNG, JPG ou WebP.' }
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: 'A imagem passa de 5 MB. Escolha um arquivo menor.' }
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return { ok: false, message: 'Não foi possível ler a imagem. Tente outro arquivo.' }
  }

  try {
    const side = Math.min(bitmap.width, bitmap.height)
    if (side < MIN_SIDE) {
      return {
        ok: false,
        message: `A imagem é pequena demais (${bitmap.width} × ${bitmap.height} px). Use pelo menos ${MIN_SIDE} × ${MIN_SIDE} px.`,
      }
    }

    const outputSide = Math.min(side, OUTPUT_SIDE)
    const canvas = document.createElement('canvas')
    canvas.width = outputSide
    canvas.height = outputSide
    const context = canvas.getContext('2d')
    if (!context) {
      return { ok: false, message: 'Não foi possível processar a imagem neste navegador.' }
    }
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      outputSide,
      outputSide,
    )
    return { ok: true, dataUrl: canvas.toDataURL('image/webp', 0.85) }
  } finally {
    bitmap.close()
  }
}

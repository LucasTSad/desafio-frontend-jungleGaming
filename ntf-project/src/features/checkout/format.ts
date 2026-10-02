/** Abrevia endereços e hashes longos mantendo início e fim (0xA91F…E82C). */
export function shortenHex(value: string, head = 6, tail = 4) {
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** Data no formato do recibo do Figma: "29 Jul, 2026". */
export function formatReceiptDate(iso: string) {
  const date = new Date(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${date.getFullYear()}`
}

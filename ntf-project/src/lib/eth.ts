/**
 * Valores em ETH trafegam como string decimal ("1.19") e as contas são feitas em wei (bigint),
 * para não perder precisão com ponto flutuante.
 */

export const ETH_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)

export const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function toWei(eth: string): bigint {
  if (!ETH_PATTERN.test(eth)) throw new Error(`Valor em ETH inválido: "${eth}"`)
  const [whole = '0', fraction = ''] = eth.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

export function fromWei(wei: bigint): string {
  const negative = wei < 0n
  const absolute = negative ? -wei : wei
  const whole = absolute / WEI_PER_ETH
  const fraction = (absolute % WEI_PER_ETH)
    .toString()
    .padStart(ETH_DECIMALS, '0')
    .replace(/0+$/, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

export function addEth(...values: string[]): string {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

export function subtractEth(value: string, amount: string): string {
  return fromWei(toWei(value) - toWei(amount))
}

export function multiplyEth(value: string, quantity: number): string {
  if (!Number.isInteger(quantity)) throw new Error('A quantidade precisa ser inteira.')
  return fromWei(toWei(value) * BigInt(quantity))
}

/** Aplica uma taxa em pontos-base (1000 = 10%), arredondando para baixo no último wei. */
export function percentOfEth(value: string, basisPoints: number): string {
  return fromWei((toWei(value) * BigInt(basisPoints)) / 10_000n)
}

export function compareEth(a: string, b: string): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function isZeroEth(value: string) {
  return toWei(value) === 0n
}

/** Converte para número só para exibição e ordenação visual; nunca use o resultado em contas. */
export function ethToNumber(value: string) {
  return Number(value)
}

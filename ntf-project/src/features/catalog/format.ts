const ethFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const ethRangeFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// O Figma usa ponto nos preços dos cards ("1.19 ETH") e vírgula na faixa de preço ("0,02 - 12,30 ETH").
export function formatEth(value: number) {
  return `${ethFormatter.format(value)} ETH`
}

export function formatEthRange(min: number, max: number) {
  return `${ethRangeFormatter.format(min)} - ${ethRangeFormatter.format(max)} ETH`
}

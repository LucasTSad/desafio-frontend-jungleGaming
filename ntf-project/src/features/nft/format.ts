const ratingFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

export const formatRating = (value: number) => ratingFormatter.format(value)

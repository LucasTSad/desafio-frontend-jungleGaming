import { toast } from 'sonner'

// Ações fora do escopo do desafio informam a indisponibilidade em vez de simular sucesso.
export function notifyUnavailable(feature: string) {
  toast.info(`${feature} não está disponível nesta demonstração.`, {
    id: `unavailable-${feature}`,
  })
}

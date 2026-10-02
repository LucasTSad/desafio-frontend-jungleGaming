import { useEffect, useState } from 'react'
import { subscribeAnnouncements } from '@/lib/announce'

export function LiveRegion() {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')

  useEffect(
    () =>
      subscribeAnnouncements((message, politeness) => {
        const setMessage = politeness === 'assertive' ? setAssertive : setPolite
        // Limpar antes de repetir a mesma mensagem garante que o leitor de tela a anuncie de novo.
        setMessage('')
        requestAnimationFrame(() => setMessage(message))
      }),
    [],
  )

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </>
  )
}

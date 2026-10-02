type Politeness = 'polite' | 'assertive'
type Listener = (message: string, politeness: Politeness) => void

const listeners = new Set<Listener>()

export function announce(message: string, politeness: Politeness = 'polite') {
  for (const listener of listeners) listener(message, politeness)
}

export function subscribeAnnouncements(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

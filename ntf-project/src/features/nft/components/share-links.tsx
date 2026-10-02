import { Mail } from 'lucide-react'
import { LinkedinIcon, XIcon } from '@/components/icons/brand-icons'

type ShareLinksProps = {
  name: string
  url: string
}

export function ShareLinks({ name, url }: ShareLinksProps) {
  const text = `Conheça ${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: <LinkedinIcon className="size-4" />,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: <Mail className="size-4" />,
    },
    {
      label: 'X',
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <XIcon className="size-3.5" />,
    },
  ]

  return (
    <div className="flex items-center gap-3">
      <p className="text-[15px] font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-1">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-7 items-center justify-center rounded-sm transition-colors hover:text-brand"
            >
              <span aria-hidden="true">{link.icon}</span>
              <span className="sr-only">Compartilhar por {link.label} (abre em nova aba)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

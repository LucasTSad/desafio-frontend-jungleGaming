import { createFileRoute } from '@tanstack/react-router'
import { Heart, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { NftImage } from '@/components/common/nft-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { catalogSearchSchema } from '@/features/catalog/search-params'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  staticData: { nav: 'home', mobileTabBar: true },
  component: HomePage,
})

const ARTS = [
  { src: '/images/nfts/emerald', name: 'Emerald Ape #042' },
  { src: '/images/nfts/sage', name: 'Sage Nomad #009' },
  { src: '/images/nfts/ivory', name: 'Ivory Baron #088' },
  { src: '/images/nfts/golden', name: 'Golden Beat #207' },
]

// Prévia temporária do design system; a Home real é construída na fase 2a.
function HomePage() {
  return (
    <div className="page-container flex flex-col gap-14 py-10 md:py-16">
      <section className="flex flex-col gap-4">
        <p className="text-sm">Bem-vindo à Kurio</p>
        <h1 className="max-w-[600px] text-[28px] leading-[44px] font-bold tracking-wide md:text-[44px] md:leading-[70px]">
          SEJA DONO DO FUTURO DA ARTE DIGITAL
        </h1>
        <p className="max-w-[557px] text-sm leading-6 text-muted-foreground">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Button className="w-fit px-8">EXPLORAR</Button>
      </section>

      <section id="mercado" className="flex flex-col gap-6">
        <h2 className="text-lg font-bold">Prévia do design system</h2>

        <div className="flex flex-wrap items-center gap-3">
          <Button>COMPRAR</Button>
          <Button variant="outline">
            <Heart aria-hidden="true" />
            Favoritar
          </Button>
          <Button variant="outline-primary">Aplicar</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Continuar explorando</Button>
          <Button size="sm">
            <LogIn aria-hidden="true" />
            Entrar
          </Button>
          <Button variant="gradient" size="pill">
            Comprar NFT
          </Button>
          <Button disabled>Indisponível</Button>
          <Button variant="outline" onClick={() => toast.success('Toast de exemplo exibido.')}>
            Mostrar toast
          </Button>
        </div>

        <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-name">
              Nome de exibição <span className="text-destructive">*</span>
            </Label>
            <Input id="preview-name" placeholder="Seu nome" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-network">
              Rede <span className="text-destructive">*</span>
            </Label>
            <Select>
              <SelectTrigger id="preview-network" className="w-full">
                <SelectValue placeholder="Selecione uma rede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="preview-error">E-mail</Label>
            <Input
              id="preview-error"
              aria-invalid
              defaultValue="contato@"
              aria-describedby="preview-error-msg"
            />
            <p id="preview-error-msg" className="text-xs text-destructive">
              Informe um e-mail válido.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {ARTS.map((art, index) => (
            <figure key={art.src} className="flex flex-col gap-3 rounded-lg bg-surface p-1">
              <NftImage
                src={art.src}
                alt={`Ilustração do NFT ${art.name}`}
                sizes="(min-width: 1024px) 200px, 45vw"
                priority={index === 0}
                className="aspect-square rounded-lg"
              />
              <figcaption className="flex flex-col gap-1 px-2 pb-2 text-[15px]">
                <span>{art.name}</span>
                <span className="font-bold text-brand">1.19 ETH</span>
              </figcaption>
            </figure>
          ))}
          <div className="flex flex-col gap-3 rounded-lg bg-surface p-1" aria-busy="true">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="mx-2 h-4 w-3/4" />
            <Skeleton className="mx-2 mb-2 h-4 w-1/3" />
          </div>
        </div>
      </section>
    </div>
  )
}

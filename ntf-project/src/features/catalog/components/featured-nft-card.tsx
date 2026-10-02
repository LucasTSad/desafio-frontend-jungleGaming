import { Link } from '@tanstack/react-router'
import { NftImage } from '@/components/common/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '../types'

/** Sem `nft` (destaque ainda carregando), mostra o mesmo cartão com a imagem em skeleton. */
export function FeaturedNftCard({ nft }: { nft?: NftSummary }) {
  if (!nft) {
    return (
      <div className="flex flex-col bg-linear-to-b from-[#2a1a10] to-surface">
        <div className="flex flex-col gap-3 px-5 pt-6 pb-3">
          <p className="text-[22px] leading-8 font-bold text-brand">NFT EM DESTAQUE</p>
          <p className="text-center text-xl font-bold">OFERTA LIMITADA</p>
        </div>
        <Skeleton className="aspect-[310/368] rounded-3xl" />
      </div>
    )
  }

  // O nome do link vem do próprio texto visível, mais o nome do NFT só para leitores de tela: um
  // aria-label diferente do que está escrito confunde quem navega por voz (WCAG 2.5.3). A arte fica
  // sem alt porque o link já diz para onde leva.
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      className="group flex flex-col bg-linear-to-b from-[#2a1a10] to-surface"
    >
      <div className="flex flex-col gap-3 px-5 pt-6 pb-3">
        <p className="text-[22px] leading-8 font-bold text-brand">NFT EM DESTAQUE</p>
        <p className="text-center text-xl font-bold">
          OFERTA LIMITADA<span className="sr-only">: {nft.name}</span>
        </p>
      </div>
      <NftImage
        src={nft.artwork.src}
        alt=""
        sizes="310px"
        className="aspect-[310/368] rounded-3xl"
        imgClassName="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    </Link>
  )
}

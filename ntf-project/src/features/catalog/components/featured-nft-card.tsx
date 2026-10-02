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

  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: nft.id }}
      aria-label={`NFT em destaque, oferta limitada: ${nft.name}`}
      className="group flex flex-col bg-linear-to-b from-[#2a1a10] to-surface"
    >
      <div className="flex flex-col gap-3 px-5 pt-6 pb-3">
        <p className="text-[22px] leading-8 font-bold text-brand">NFT EM DESTAQUE</p>
        <p className="text-center text-xl font-bold">OFERTA LIMITADA</p>
      </div>
      <NftImage
        src={nft.artwork.src}
        alt={nft.artwork.alt}
        sizes="310px"
        className="aspect-[310/368] rounded-3xl"
        imgClassName="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
    </Link>
  )
}

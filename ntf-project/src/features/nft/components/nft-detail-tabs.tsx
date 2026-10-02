import { Tabs } from 'radix-ui'
import type { NftDetail, NftReview } from '../types'
import { formatRating } from '../format'
import { StarRating } from './star-rating'

export type NftDetailTab = 'detalhes' | 'avaliacoes'

type NftDetailTabsProps = {
  nft: NftDetail
  reviews: NftReview[]
  value: NftDetailTab
  onChange: (tab: NftDetailTab) => void
}

const TRIGGER_CLASSES =
  'relative pb-2.5 text-base whitespace-nowrap text-foreground transition-colors hover:text-brand data-[state=active]:font-semibold data-[state=active]:text-brand data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' })

export function NftDetailTabs({ nft, reviews, value, onChange }: NftDetailTabsProps) {
  return (
    <Tabs.Root
      id="nft-tabs"
      value={value}
      onValueChange={(next) => onChange(next as NftDetailTab)}
      className="scroll-mt-6"
    >
      <Tabs.List
        aria-label="Informações do NFT"
        className="flex gap-8 overflow-x-auto border-b border-border"
      >
        <Tabs.Trigger value="detalhes" className={TRIGGER_CLASSES}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="avaliacoes" className={TRIGGER_CLASSES}>
          Avaliações<span className="hidden md:inline"> de colecionadores</span> ({nft.rating.count}
          )
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="detalhes" className="flex flex-col gap-4 pt-4 text-sm leading-6">
        {nft.story.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="text-muted-foreground">
            {paragraph}
          </p>
        ))}
        <dl className="flex flex-col gap-3">
          {[
            ['Rede', nft.networkInfo],
            ['Contrato', nft.contract],
            ['Direitos autorais', nft.royalties],
          ].map(([term, description]) => (
            <div key={term}>
              <dt className="font-bold">{term}:</dt>
              <dd className="text-muted-foreground">{description}</dd>
            </div>
          ))}
        </dl>
      </Tabs.Content>

      <Tabs.Content value="avaliacoes" className="flex flex-col gap-6 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-bold">{formatRating(nft.rating.average)}</span>
          <div className="flex flex-col gap-1">
            <StarRating value={nft.rating.average} />
            <span className="text-sm text-muted-foreground">
              Mostrando {reviews.length} de {nft.rating.count} avaliações
            </span>
          </div>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col gap-2 rounded-lg bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{review.author}</span>
                <time dateTime={review.date} className="text-xs text-muted-foreground">
                  {dateFormatter.format(new Date(review.date))}
                </time>
              </div>
              <StarRating value={review.rating} starClassName="size-3.5" />
              <p className="text-sm leading-6 text-muted-foreground">{review.comment}</p>
            </li>
          ))}
        </ul>
      </Tabs.Content>
    </Tabs.Root>
  )
}

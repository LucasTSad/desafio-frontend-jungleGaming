import { Link } from '@tanstack/react-router'
import { CircleX, LoaderCircle, X } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { cn } from 'cn'
import { NftImage } from '@/components/common/nft-image'
import { Button } from '@/components/ui/button'
import { formatEth } from '@/features/catalog/format'
import { formatReceiptDate, shortenHex } from '@/features/checkout/format'
import { networkLabel, providerLabel } from '@/features/checkout/types'
import type { Order } from '../types'
import { ThankYouIllustration } from './thank-you-illustration'

type OrderViewProps = {
  order: Order
  onViewExplorer: (order: Order) => void
}

export function OrderView({ order, onViewExplorer }: OrderViewProps) {
  const titleId = useId()
  const network = networkLabel(order.network)

  return (
    <article
      aria-labelledby={titleId}
      className="relative mx-auto w-full max-w-[578px] rounded-t-md border-b-[10px] border-primary bg-surface"
    >
      <Link
        to="/"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-brand transition-colors hover:bg-accent"
      >
        <X className="size-5" aria-hidden="true" />
        <span className="sr-only">Fechar e voltar ao início</span>
      </Link>

      <OrderHeader order={order} titleId={titleId} />

      <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3 text-[13px] leading-5 text-muted-foreground sm:grid-cols-[auto_auto_auto_auto] sm:justify-between sm:px-9">
        <StripItem label="ID da transação" strong>
          <span title={order.transactionHash}>{shortenHex(order.transactionHash)}</span>
        </StripItem>
        <StripItem label="Data">{formatReceiptDate(order.createdAt)}</StripItem>
        <StripItem label="Total">{formatEth(order.totals.totalEth)}</StripItem>
        <StripItem label="Carteira" strong>
          {providerLabel(order.provider)}
        </StripItem>
      </dl>

      <section aria-labelledby={`${titleId}-details`} className="px-5 pt-6 sm:px-11">
        <h2 id={`${titleId}-details`} className="text-[15px] font-bold">
          Detalhes da transação
        </h2>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="border-b border-[#503320] text-[15px]">
              <th scope="col" className="pb-2 font-semibold">
                NFTs
              </th>
              <th scope="col" className="pb-2 text-center font-semibold">
                Edições
              </th>
              <th scope="col" className="pb-2 text-right font-semibold">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={line.id}>
                <td className="pt-3">
                  <div className="flex items-center gap-3">
                    <NftImage
                      src={line.artwork.src}
                      alt=""
                      sizes="70px"
                      className="size-14 shrink-0 rounded-md max-[359px]:hidden sm:size-[70px]"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-bold sm:text-[15px]">{line.name}</p>
                      <p className="text-xs text-subtle-foreground sm:text-[13px]">
                        ID do token: {line.tokenId}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-2 pt-3 text-center text-[13px] whitespace-nowrap text-muted-foreground">
                  <span className="block text-xs text-subtle-foreground">
                    <span className="sr-only">Edição </span>
                    {line.editionLabel}
                  </span>
                  <span aria-hidden="true">(x {line.quantity})</span>
                  <span className="sr-only">, {line.quantity} unidades</span>
                </td>
                <td className="pt-3 text-right text-base font-bold whitespace-nowrap text-brand sm:text-lg">
                  {formatEth(line.subtotalEth)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-5 ml-auto flex max-w-[322px] flex-col gap-1.5 border-b border-[#503320] pb-2 text-[15px]">
          {order.totals.discountEth > 0 && (
            <TotalRow label="Desconto" value={`(-) ${formatEth(order.totals.discountEth)}`} />
          )}
          <TotalRow label="Taxa de rede" value={formatEth(order.totals.networkFeeEth)} />
          <TotalRow label="Total" value={formatEth(order.totals.totalEth)} emphasis />
        </dl>
      </section>

      <OrderFooter order={order} network={network} onViewExplorer={onViewExplorer} />
    </article>
  )
}

function OrderHeader({ order, titleId }: { order: Order; titleId: string }) {
  if (order.status === 'confirmed') {
    return (
      <header className="flex flex-col items-center gap-4 px-12 pt-6 pb-5 text-center">
        <ThankYouIllustration className="h-20 w-[66px] text-primary" />
        <h1 id={titleId} className="text-base font-bold text-muted-foreground">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>
    )
  }

  if (order.status === 'refused') {
    return (
      <header className="flex flex-col items-center gap-3 px-12 pt-6 pb-5 text-center">
        <CircleX className="size-14 text-destructive" strokeWidth={1.5} aria-hidden="true" />
        <h1 id={titleId} className="text-base font-bold">
          Pagamento recusado
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {order.failureReason} Nenhum valor foi cobrado e seus itens continuam no carrinho.
        </p>
      </header>
    )
  }

  return (
    <header className="flex flex-col items-center gap-3 px-12 pt-6 pb-5 text-center">
      <LoaderCircle
        className="size-14 animate-spin text-brand motion-reduce:animate-none"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h1 id={titleId} className="text-base font-bold">
        Aguardando confirmação na rede
      </h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        O pagamento foi enviado pela {providerLabel(order.provider)}. A confirmação costuma levar
        alguns segundos; você pode sair desta página e voltar depois.
      </p>
    </header>
  )
}

type OrderFooterProps = {
  order: Order
  network: string
  onViewExplorer: (order: Order) => void
}

function OrderFooter({ order, network, onViewExplorer }: OrderFooterProps) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 pt-5 pb-12 text-center sm:px-14">
      {order.status === 'confirmed' && (
        <>
          <p className="text-[13px] leading-[22px] text-muted-foreground">
            Transação confirmada na {network}. A propriedade foi transferida para sua carteira
            conectada e registrada na rede.
          </p>
          <Button
            onClick={() => onViewExplorer(order)}
            className="h-[46px] px-4 text-base font-bold"
          >
            Ver no {order.network === 'polygon' ? 'Polygonscan' : 'Etherscan'}
          </Button>
        </>
      )}
      {order.status === 'pending' && (
        <p className="text-[13px] leading-[22px] text-muted-foreground">
          Os valores acima estão congelados neste pedido e não mudam com o catálogo.
        </p>
      )}
      {order.status === 'refused' && (
        <div className="flex flex-wrap justify-center gap-3">
          <Button asChild className="h-[46px] px-4 text-base font-bold">
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline-primary" className="h-[46px] px-4 text-base">
            <Link to="/carrinho">Ver carrinho</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

function StripItem({
  label,
  strong,
  children,
}: {
  label: string
  strong?: boolean
  children: ReactNode
}) {
  return (
    <div className="flex flex-col sm:border-l sm:border-[#a76d3e] sm:pl-4 sm:first:border-l-0 sm:first:pl-0">
      <dt className={cn(strong && 'font-bold')}>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function TotalRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex justify-between gap-6">
      <dt className={cn(emphasis && 'font-bold')}>{label}</dt>
      <dd className={cn(emphasis && 'text-lg font-bold text-brand')}>{value}</dd>
    </div>
  )
}

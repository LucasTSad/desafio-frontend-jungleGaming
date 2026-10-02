import { NftImage } from '@/components/common/nft-image'
import { notifyUnavailable } from '@/lib/notify-unavailable'
import { JOURNAL_POSTS } from '../content'

export function MintJournal() {
  return (
    <section aria-labelledby="journal-title" className="page-container pb-16 lg:pb-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 id="journal-title" className="text-2xl font-bold md:text-[28px]">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {JOURNAL_POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface">
              <NftImage
                src={post.image}
                alt=""
                sizes="(min-width: 1024px) 282px, (min-width: 640px) 45vw, 90vw"
                className="aspect-[268/195]"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs leading-4 text-muted-foreground">
                  {post.date} &nbsp;|&nbsp; {post.readingTime}
                </p>
                <h3 className="text-base leading-[21px] font-bold">{post.title}</h3>
                <p className="text-xs leading-4 text-muted-foreground">{post.excerpt}</p>
                <button
                  type="button"
                  onClick={() => notifyUnavailable('O Diário da Cunhagem')}
                  className="mt-auto w-fit pt-1 text-xs font-bold text-brand hover:underline"
                >
                  Ler mais <span aria-hidden="true">→</span>
                  <span className="sr-only">: {post.title}</span>
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

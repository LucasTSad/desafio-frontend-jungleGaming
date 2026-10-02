import { Fragment } from 'react'
import { Link, type LinkProps } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export type BreadcrumbEntry = {
  label: string
  link?: Pick<LinkProps, 'to' | 'params' | 'search' | 'hash'>
}

export function PageBreadcrumbs({ items }: { items: BreadcrumbEntry[] }) {
  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList className="gap-1.5 text-[13px] font-medium text-foreground sm:gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <Fragment key={item.label}>
              <BreadcrumbItem>
                {isLast || !item.link ? (
                  <BreadcrumbPage className="text-foreground">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="text-foreground hover:text-brand">
                    <Link {...item.link}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="text-foreground">/</BreadcrumbSeparator>}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

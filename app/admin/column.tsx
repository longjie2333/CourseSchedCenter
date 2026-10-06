import type * as React from 'react'
import { Frame, FramePanel } from '~/components/ui/frame.tsx'
import { cn } from '~/lib/utils.ts'

/**
 * The three columns never scroll the page: the grid fills the viewport below the
 * navbar and every column scrolls on its own. The minimum width keeps the middle
 * column wider than both sides; below it the surrounding `<main>` scrolls
 * horizontally instead of collapsing the columns.
 */
export function ColumnGrid({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid h-full min-h-0 min-w-272 grid-cols-[minmax(0,18rem)_minmax(24rem,1fr)_minmax(0,23rem)] gap-3',
        className,
      )}
      {...props}
    />
  )
}

export function Column({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <Frame className={cn('min-h-0 min-w-0', className)} {...props}>
      <FramePanel className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">{children}</FramePanel>
    </Frame>
  )
}

/** Scroll host for a column body: keeps `ScrollArea` inside the remaining space. */
export function ColumnBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-h-0 flex-1', className)} {...props} />
}

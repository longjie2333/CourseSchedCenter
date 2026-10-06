import { ChevronLeftIcon, ChevronRightIcon, InboxIcon, RefreshCwIcon } from 'lucide-react'
import { Badge } from '~/components/ui/badge.tsx'
import { Button } from '~/components/ui/button.tsx'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty.tsx'
import { FrameFooter, FrameHeader } from '~/components/ui/frame.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { Skeleton } from '~/components/ui/skeleton.tsx'
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group.tsx'
import { cn } from '~/lib/utils.ts'
import { type FeedbackListResponse, formatDateTime } from '../../admin-api.ts'
import { Column, ColumnBody } from '../column.tsx'
import { statusFilters, type StatusFilter, statusMeta } from './feedback-status.ts'

export function FeedbackList({
  list,
  status,
  page,
  loading,
  error,
  selectedId,
  onStatusChange,
  onPageChange,
  onSelect,
  onRefresh,
}: {
  list: FeedbackListResponse | null
  status: StatusFilter
  page: number
  loading: boolean
  error: string | null
  selectedId: number | null
  onStatusChange: (status: StatusFilter) => void
  onPageChange: (page: number) => void
  onSelect: (id: number) => void
  onRefresh: () => void
}) {
  const totalPages = list?.pagination.totalPages ?? 1
  const items = list?.items ?? []

  return (
    <Column>
      <FrameHeader className="shrink-0 flex-row items-center gap-2 border-b px-3">
        <ToggleGroup
          aria-label="反馈状态筛选"
          className="flex-1 *:min-w-0"
          onValueChange={(value) => {
            const next = value[0]
            if (next) onStatusChange(next as StatusFilter)
          }}
          size="sm"
          value={[status]}
        >
          {statusFilters.map((filter) => {
            const count = list?.counts[filter.value] ?? 0
            const label = `${filter.label} ${count}`
            const Icon = filter.icon
            return (
              <ToggleGroupItem
                aria-label={label}
                className="px-2.5 text-xs"
                key={filter.value}
                title={label}
                value={filter.value}
              >
                <Icon />
                {status === filter.value && <span className="tabular-nums">{count}</span>}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
        <Button
          aria-label={loading ? '刷新中…' : '刷新'}
          disabled={loading}
          loading={loading}
          onClick={onRefresh}
          size="icon-sm"
          variant="outline"
        >
          <RefreshCwIcon />
        </Button>
      </FrameHeader>

      <ColumnBody>
        <ScrollArea scrollbarGutter={true}>
          {loading && !list && (
            <div className="flex flex-col gap-3 p-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {error && (
            <div className="m-3 flex flex-col items-start gap-3 rounded-xl border border-destructive/32 bg-destructive/4 p-4">
              <p className="text-destructive-foreground text-sm">{error}</p>
              <Button onClick={onRefresh} variant="secondary">
                重试
              </Button>
            </div>
          )}

          {!loading && !error && list && items.length === 0 && (
            <Empty className="py-12 md:py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <InboxIcon />
                </EmptyMedia>
                <EmptyTitle>暂无反馈</EmptyTitle>
                <EmptyDescription>当前筛选条件下没有用户反馈</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {items.length > 0 && (
            <ul className="flex flex-col gap-1 p-2">
              {items.map((item) => {
                const meta = statusMeta[item.replyStatus]
                return (
                  <li key={item.id}>
                    <button
                      className={cn(
                        'flex w-full flex-col gap-1.5 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
                        selectedId === item.id && 'bg-accent',
                      )}
                      onClick={() => onSelect(item.id)}
                      type="button"
                    >
                      <span className="line-clamp-2 text-sm">{item.contentPreview || '（空）'}</span>
                      <span className="flex items-center justify-between gap-2">
                        <Badge size="sm" variant={meta.variant}>
                          {meta.label}
                        </Badge>
                        <span className="text-muted-foreground text-xs">{formatDateTime(item.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </ScrollArea>
      </ColumnBody>

      {items.length > 0 && (
        <FrameFooter className="flex shrink-0 items-center justify-between gap-2 border-t px-3">
          <Button
            aria-label="上一页"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronLeftIcon />
          </Button>
          <span className="text-muted-foreground text-xs tabular-nums">{`第 ${page} / ${totalPages} 页`}</span>
          <Button
            aria-label="下一页"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            size="icon-sm"
            variant="outline"
          >
            <ChevronRightIcon />
          </Button>
        </FrameFooter>
      )}
    </Column>
  )
}

import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { FrameHeader, FrameTitle } from '~/components/ui/frame.tsx'
import { type NoticeHistoryItem, type NoticeMode, formatDateTime } from '../../admin-api.ts'
import { Column, ColumnBody } from '../column.tsx'
import { historyTitle } from './notice-form.ts'

export function NoticeHistory({
  mode,
  items,
  onApply,
}: {
  mode: NoticeMode
  items: NoticeHistoryItem[]
  onApply: (item: NoticeHistoryItem) => void
}) {
  return (
    <Column>
      <FrameHeader className="shrink-0 border-b">
        <FrameTitle>历史记录</FrameTitle>
      </FrameHeader>
      <ColumnBody>
        <ScrollArea scrollbarGutter={true}>
          {items.length > 0 ? (
            <div className="flex flex-col gap-1 p-2">
              {items.map((item) => (
                <button
                  className="flex flex-col items-start gap-1 rounded-lg px-3 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  key={`${item.mode}-${item.updatedAt}-${historyTitle(item)}`}
                  onClick={() => onApply(item)}
                  type="button"
                >
                  <span className="line-clamp-2 w-full text-sm">{historyTitle(item)}</span>
                  <span className="text-muted-foreground text-xs">{formatDateTime(item.updatedAt)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-5 py-8 text-center text-muted-foreground text-sm">暂无历史记录</p>
          )}
        </ScrollArea>
      </ColumnBody>
    </Column>
  )
}

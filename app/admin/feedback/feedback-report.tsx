import { FileJsonIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty.tsx'
import { FrameDescription, FrameHeader, FrameTitle } from '~/components/ui/frame.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { Skeleton } from '~/components/ui/skeleton.tsx'
import type { FeedbackDetail } from '../../admin-api.ts'
import { Column, ColumnBody } from '../column.tsx'
import { JsonView } from '../json-view.tsx'

/** `report` is stored as a JSON string; only object payloads get the tree view. */
function parseReport(report: string | null | undefined): object | null {
  if (!report) return null
  try {
    const parsed: unknown = JSON.parse(report)
    return parsed && typeof parsed === 'object' ? (parsed as object) : null
  } catch {
    return null
  }
}

export function FeedbackReport({ detail, loading }: { detail: FeedbackDetail | null; loading: boolean }) {
  const reportObject = useMemo(() => parseReport(detail?.report), [detail?.report])

  return (
    <Column>
      <FrameHeader className="shrink-0 border-b">
        <FrameTitle>日志报告</FrameTitle>
        <FrameDescription className="text-xs">
          {detail ? `反馈 #${detail.id}` : '选择反馈后展示其日志报告'}
        </FrameDescription>
      </FrameHeader>

      <ColumnBody>
        <ScrollArea scrollbarGutter={true}>
          {loading && !detail && (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-40 w-full" />
            </div>
          )}

          {!loading && !detail && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileJsonIcon />
                </EmptyMedia>
                <EmptyTitle>请选择一条反馈</EmptyTitle>
                <EmptyDescription>从左侧列表选择反馈后查看日志报告</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {detail && (
            <div className="p-4">
              {reportObject ? (
                <JsonView collapsed={2} src={reportObject} />
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs leading-5">
                  {detail.report || '（空）'}
                </pre>
              )}
            </div>
          )}
        </ScrollArea>
      </ColumnBody>
    </Column>
  )
}

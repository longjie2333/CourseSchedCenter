import { CheckIcon, ClockIcon, ListIcon, type LucideIcon, TriangleAlertIcon } from 'lucide-react'
import type { ReplyStatus } from '../../admin-api.ts'

export type StatusFilter = 'all' | ReplyStatus

export const statusMeta: Record<ReplyStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' }> = {
  failed: { label: '发送失败', variant: 'error' },
  pending: { label: '待回复', variant: 'warning' },
  replied: { label: '已回复', variant: 'success' },
  sending: { label: '发送中', variant: 'info' },
}

/** The list column is narrow, so each filter shows its icon plus a count; `label` becomes the
 *  accessible name and the hover title. */
export const statusFilters: { value: StatusFilter; label: string; icon: LucideIcon }[] = [
  { icon: ListIcon, label: '全部', value: 'all' },
  { icon: ClockIcon, label: '待回复', value: 'pending' },
  { icon: CheckIcon, label: '已回复', value: 'replied' },
  { icon: TriangleAlertIcon, label: '失败', value: 'failed' },
]

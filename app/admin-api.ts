export type NoticeMode = 'dialog' | 'bar'
export type ReplyStatus = 'pending' | 'sending' | 'replied' | 'failed'
export const JWT_COOKIE = 'admin_session'

export interface DialogConfig {
  title: string
  content: string
  confirmBtn?: string
  cancelBtn?: string
  closeOnOverlayClick: boolean
  showOverlay: boolean
  preventScrollThrough: boolean
  zIndex?: number
  overlayProps?: {
    backgroundColor?: string
    duration?: number
    zIndex?: number
    preventScrollThrough?: boolean
    usingCustomNavbar?: boolean
  }
  pubdate?: string
}

export interface BarConfig {
  content: string | string[]
  direction?: 'horizontal' | 'vertical'
  interval?: number
  marquee?: boolean | { speed?: number; loop?: number; delay?: number }
  operation?: string
  prefixIcon?: string | boolean | Record<string, unknown>
  suffixIcon?: string | Record<string, unknown>
  theme?: 'info' | 'success' | 'warning' | 'error'
  visible?: boolean
  defaultVisible?: boolean
  pubdate?: string
}

export interface NoticePayload {
  dialog?: DialogConfig
  bar?: BarConfig
}

export interface NoticeHistoryItem {
  mode: NoticeMode
  notice: NoticePayload
  updatedAt: string
}

export interface AdminNoticeResponse {
  notice: NoticePayload | null
  updatedAt: string | null
  history: NoticeHistoryItem[]
}

export interface FeedbackListItem {
  id: number
  createdAt: string
  contact: string | null
  contentPreview: string
  imageCount: number
  replyStatus: ReplyStatus
  repliedAt: string | null
}

export interface FeedbackListResponse {
  items: FeedbackListItem[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
  counts: Record<'all' | ReplyStatus, number>
}

export interface FeedbackDetail {
  id: number
  createdAt: string
  openid: string
  config: string
  contact: string | null
  content: string
  report: string | null
  answer: boolean | null
  files: string[]
  replyStatus: ReplyStatus
  replyContent: string | null
  replyAttemptedAt: string | null
  repliedAt: string | null
  replyError: string | null
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const payload = (await response.json()) as {
    data?: T
    error?: { code?: string; message?: string }
  } | null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.error?.code ?? 'UNKNOWN',
      payload?.error?.message ?? '请求失败，请稍后重试',
    )
  }

  return payload?.data as T
}

export const adminApi = {
  login: (code: string) =>
    request<{ token: string; expiresAt: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  getNotice: () => request<AdminNoticeResponse>('/api/admin/notice'),
  saveNotice: (notice: NoticePayload) =>
    request<AdminNoticeResponse>('/api/admin/notice', {
      method: 'PUT',
      body: JSON.stringify(notice),
    }),
  listFeedback: (status: ReplyStatus | 'all', page: number) =>
    request<FeedbackListResponse>(`/api/admin/feedback?status=${status}&page=${page}&pageSize=20`),
  getFeedback: (id: number) => request<FeedbackDetail>(`/api/admin/feedback/${id}`),
  replyFeedback: (id: number, content: string) =>
    request<FeedbackDetail>(`/api/admin/feedback/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '暂无'
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

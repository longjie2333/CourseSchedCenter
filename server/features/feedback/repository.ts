import { useDatabase } from 'nitro/database'
import type { ReplyStatus } from './schemas.ts'

export type FeedbackDetail = {
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

const rowDetail = (row: Record<string, unknown>): FeedbackDetail => {
  let files: string[] = []

  try {
    const parsed = JSON.parse(String(row.files_json || '[]'))
    if (Array.isArray(parsed)) files = parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    /* ignore malformed stored files */
  }

  return {
    id: Number(row.id),
    createdAt: String(row.created_at),
    openid: String(row.openid),
    config: String(row.config ?? ''),
    contact: row.contact as string | null,
    content: String(row.content),
    report: row.report as string | null,
    answer: row.answer === 1 ? true : row.answer === 0 ? false : null,
    files,
    replyStatus: row.reply_status as ReplyStatus,
    replyContent: row.reply_content as string | null,
    replyAttemptedAt: row.reply_attempted_at as string | null,
    repliedAt: row.replied_at as string | null,
    replyError: row.reply_error as string | null,
  }
}

export const insertFeedback = async (input: {
  openid: string
  config: string
  contact: string | null
  content: string
  report: Record<string, unknown> | null
  answer: boolean | null
  files: string[]
}) => {
  const result = (await useDatabase()
    .prepare(
      'INSERT INTO feedbacks (created_at, openid, config, contact, content, report, answer, files_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      new Date().toISOString(),
      input.openid,
      input.config,
      input.contact,
      input.content,
      input.report ? JSON.stringify(input.report) : null,
      input.answer === null ? null : input.answer ? 1 : 0,
      JSON.stringify(input.files),
    )
    .run()) as { lastInsertRowid?: number }
  return Number(result.lastInsertRowid)
}

export const countFeedback = async () => {
  const rows = (await useDatabase()
    .prepare('SELECT reply_status AS status, COUNT(*) AS count FROM feedbacks GROUP BY reply_status')
    .all()) as Record<string, unknown>[]
  const result = { all: 0, pending: 0, sending: 0, replied: 0, failed: 0 }

  for (const row of rows) {
    const count = Number(row.count)
    const status = row.status as keyof typeof result

    if (status !== 'all' && status in result) result[status] += count

    result.all += count
  }

  return result
}

export const findFeedbackPage = async (page: number, pageSize: number, status: string) => {
  const db = useDatabase()
  const where = status === 'all' ? '' : 'WHERE reply_status = ?'
  const args = status === 'all' ? [] : [status]
  const offset = (page - 1) * pageSize
  const count = (await db
    .prepare(`SELECT COUNT(*) AS total FROM feedbacks ${where}`)
    .bind(...args)
    .get()) as { total?: number } | undefined
  const rows = (await db
    .prepare(
      `SELECT id, created_at, contact, content, (LENGTH(files_json) - LENGTH(REPLACE(files_json, 'data:image/', ''))) / LENGTH('data:image/') AS image_count, reply_status, replied_at FROM feedbacks ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .bind(...args, pageSize, offset)
    .all()) as Record<string, unknown>[]
  return {
    total: Number(count?.total ?? 0),
    items: rows.map((row) => ({
      id: Number(row.id),
      createdAt: String(row.created_at),
      contact: row.contact as string | null,
      contentPreview: String(row.content),
      imageCount: Number(row.image_count),
      replyStatus: row.reply_status as ReplyStatus,
      repliedAt: row.replied_at as string | null,
    })),
  }
}

export const findFeedback = async (id: number) => {
  const row = (await useDatabase()
    .prepare(
      'SELECT id, created_at, openid, config, contact, content, report, answer, files_json, reply_status, reply_content, reply_attempted_at, replied_at, reply_error FROM feedbacks WHERE id = ?',
    )
    .bind(id)
    .get()) as Record<string, unknown> | undefined
  return row ? rowDetail(row) : null
}

export const claimReply = async (id: number, now: string, stale: string) =>
  useDatabase()
    .prepare(
      "UPDATE feedbacks SET reply_status='sending', reply_attempted_at=? WHERE id=? AND (reply_status IN ('pending','failed') OR (reply_status='sending' AND reply_attempted_at < ?))",
    )
    .bind(now, id, stale)
    .run() as Promise<{ changes?: number }>
export const markReplySuccess = async (id: number, content: string, result: unknown) => {
  await useDatabase()
    .prepare(
      "UPDATE feedbacks SET reply_status='replied', reply_content=?, replied_at=?, wechat_result_json=?, reply_error=NULL WHERE id=?",
    )
    .bind(content, new Date().toISOString(), JSON.stringify(result), id)
    .run()
}
export const markReplyFailure = async (id: number, message: string) => {
  await useDatabase()
    .prepare("UPDATE feedbacks SET reply_status='failed', reply_error=?, wechat_result_json=NULL WHERE id=?")
    .bind(message, id)
    .run()
}

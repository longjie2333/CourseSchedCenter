import { AppError } from '../../utils/http.ts'
import { findNotice, saveNoticeRow, deleteNotice } from './repository.ts'
import { noticeSchema, type Notice, type NoticeHistory, type NoticeSave } from './schemas.ts'

const content = (value: object) => {
  const copy = { ...(value as Record<string, unknown>) }
  delete copy.pubdate
  return JSON.stringify(copy)
}

export const getNotice = async () => {
  const row = await findNotice()

  if (!row)
    return {
      notice: null,
      updatedAt: null,
      history: [] as NoticeHistory[],
    }

  const noticeData: Notice = {}
  const historyData: NoticeHistory[] = []

  try {
    const json = JSON.parse(String(row.dialog_json))
    const jsonParsed = noticeSchema.safeParse(json)

    if (jsonParsed.success) {
      Object.assign(noticeData, jsonParsed.data)
    }
  } catch {
    throw new AppError(500, 'INTERNAL_ERROR', '公告数据无效')
  }

  try {
    const value = JSON.parse(String(row.history_json))

    if (Array.isArray(value)) {
      for (const item of value) {
        if (!item || typeof item !== 'object') continue

        const record = item as Record<string, unknown>
        if (record.mode !== 'dialog' && record.mode !== 'bar') continue
        if (typeof record.updatedAt !== 'string') continue

        const notice = noticeSchema.safeParse(record.notice)
        if (!notice.success || !notice.data[record.mode]) continue

        historyData.push({
          mode: record.mode,
          notice: { [record.mode]: notice.data[record.mode] },
          updatedAt: record.updatedAt,
        } as NoticeHistory)

        if (historyData.length === 20) break
      }
    }
  } catch {
    throw new AppError(500, 'INTERNAL_ERROR', '历史数据无效')
  }

  return {
    notice: noticeData,
    history: historyData,
    updatedAt: row.updated_at,
  }
}

export const saveNotice = async (input: NoticeSave, updatedAt: string) => {
  const previous = await getNotice()

  const stored = Object.fromEntries(
    Object.entries(input).map(([mode, value]) => {
      if (!value) return [mode, value]

      const previousValue = previous.notice?.[mode as 'dialog' | 'bar']
      const pubdate = previousValue && content(value) === content(previousValue) ? previousValue.pubdate : updatedAt
      return [mode, { ...value, pubdate }]
    }),
  ) as Notice

  const changes = (Object.keys(stored) as ('dialog' | 'bar')[]).flatMap((mode) => {
    const current = stored[mode]
    const before = previous.notice?.[mode]
    return current && (!before || content(current) !== content(before))
      ? [{ mode, notice: { [mode]: current } as Notice, updatedAt }]
      : []
  })

  const history: NoticeHistory[] = []
  const counts = {
    dialog: 0,
    bar: 0,
  }

  for (const item of [...changes, ...previous.history]) {
    if (counts[item.mode] >= 10) continue

    history.push(item)
    counts[item.mode] += 1
  }

  await saveNoticeRow(JSON.stringify(stored), updatedAt, JSON.stringify(history))

  return { notice: stored, updatedAt, history }
}

export { deleteNotice }

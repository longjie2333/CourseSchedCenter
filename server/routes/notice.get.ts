import { defineHandler } from 'nitro'
import { getNotice } from '../features/notice/service.ts'
import { publicOk } from '../utils/http.ts'

const text = (value: unknown) => typeof value === 'string' && value.trim().length > 0

export default defineHandler(async () => {
  const { notice } = await getNotice()
  if (!notice) return publicOk('暂无通知')()
  const publicNotice = {
    ...(notice.dialog && text(notice.dialog.title) && text(notice.dialog.content) ? { dialog: notice.dialog } : {}),
    ...(notice.bar && (Array.isArray(notice.bar.content) ? notice.bar.content.some(text) : text(notice.bar.content))
      ? { bar: notice.bar }
      : {}),
  }
  return publicNotice.dialog || publicNotice.bar ? publicOk('已获取通知')(publicNotice) : publicOk('暂无通知')()
})

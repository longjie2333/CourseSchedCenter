import { defineHandler } from 'nitro'
import { adminOk } from '../../../utils/http.ts'
import { countFeedback, findFeedbackPage } from '../../../features/feedback/repository.ts'
import { feedbackQuerySchema } from '../../../features/feedback/schemas.ts'

const preview = (content: string) => {
  const value = content.split('\n\n--- 自动诊断信息 ---')[0].trim().replace(/\s+/g, ' ')
  return value.length <= 100 ? value : `${value.slice(0, 100)}…`
}

export default defineHandler(async (event) => {
  const query = feedbackQuerySchema.parse(Object.fromEntries(event.url.searchParams))
  const [counts, list] = await Promise.all([
    countFeedback(),
    findFeedbackPage(query.page, query.pageSize, query.status),
  ])
  return adminOk({
    items: list.items.map((item) => ({ ...item, contentPreview: preview(item.contentPreview) })),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: list.total,
      totalPages: Math.max(1, Math.ceil(list.total / query.pageSize)),
    },
    counts,
  })
})

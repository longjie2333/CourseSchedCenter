import { defineHandler } from 'nitro'
import { getRouterParam } from 'h3'
import { adminOk, AppError } from '../../../../../utils/http.ts'
import { replyFeedback } from '../../../../../features/feedback/service.ts'
import { replySchema } from '../../../../../features/feedback/schemas.ts'

export default defineHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'INVALID_INPUT', '反馈 ID 无效')
  }

  const { content } = replySchema.parse(await event.req.json())

  return adminOk(await replyFeedback(id, content))
})

import { defineHandler } from 'nitro'
import { getRouterParam } from 'h3'
import { adminOk, AppError } from '../../../../utils/http.ts'
import { findFeedback } from '../../../../features/feedback/repository.ts'

export default defineHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(400, 'INVALID_INPUT', '反馈 ID 无效')
  }

  const detail = await findFeedback(id)

  if (!detail) {
    throw new AppError(404, 'NOT_FOUND', '反馈不存在')
  }

  return adminOk(detail)
})

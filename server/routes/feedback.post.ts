import { defineHandler } from 'nitro'
import { createFeedback } from '../features/feedback/service.ts'
import { feedbackSchema } from '../features/feedback/schemas.ts'
import { publicOk } from '../utils/http.ts'

export default defineHandler(async (event) => {
  await createFeedback(feedbackSchema.parse(await event.req.json()))
  return publicOk('感谢您的反馈！')()
})

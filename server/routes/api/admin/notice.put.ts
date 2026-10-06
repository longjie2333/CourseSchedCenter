import { defineHandler } from 'nitro'
import { adminOk } from '../../../utils/http.ts'
import { saveNotice } from '../../../features/notice/service.ts'
import { noticeSaveSchema } from '../../../features/notice/schemas.ts'

export default defineHandler(async (event) => {
  const input = noticeSaveSchema.parse(await event.req.json())
  return adminOk(await saveNotice(input, new Date().toISOString()))
})

import { defineHandler } from 'nitro'
import { adminOk } from '../../../utils/http.ts'
import { deleteNotice } from '../../../features/notice/service.ts'

export default defineHandler(async () => {
  await deleteNotice()
  return adminOk({ ok: true })
})

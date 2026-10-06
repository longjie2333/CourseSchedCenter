import { defineHandler } from 'nitro'
import { adminOk } from '../../../utils/http.ts'
import { getNotice } from '../../../features/notice/service.ts'

export default defineHandler(async () => {
  return adminOk(await getNotice())
})

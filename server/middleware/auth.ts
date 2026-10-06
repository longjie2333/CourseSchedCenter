import { getCookie } from 'h3'
import { defineMiddleware } from 'nitro'
import { AppError } from '../utils/http.ts'
import { JWT_COOKIE, verifyJwt } from '../features/auth/service.ts'

export default defineMiddleware(async (event) => {
  if (!event.url.pathname.startsWith('/api/admin/')) {
    return undefined
  }

  const payload = await verifyJwt(getCookie(event, JWT_COOKIE))

  if (!payload) throw new AppError(401, 'UNAUTHENTICATED', '未登录或会话已过期')

  event.context.adminSession = payload
})

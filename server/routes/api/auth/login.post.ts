import { defineHandler } from 'nitro'
import { allowLogin, JWT_TTL, signJwt, verifyTotp } from '../../../features/auth/service.ts'
import { adminOk, AppError } from '../../../utils/http.ts'
import { loginSchema } from '../../../features/auth/schemas.ts'

export default defineHandler(async (event) => {
  const input = loginSchema.parse(await event.req.json())

  if (!allowLogin()) {
    throw new AppError(429, 'RATE_LIMITED', '尝试次数过多，请稍后再试')
  }

  if (!verifyTotp(input.code)) {
    throw new AppError(401, 'UNAUTHENTICATED', '验证码不正确')
  }

  const value = await signJwt()
  const expiresAt = new Date(Date.now() + JWT_TTL * 1000).toISOString()

  return adminOk({ token: value, expiresAt })
})

import { z } from 'zod'

export const loginSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '验证码必须为 6 位数字'),
})

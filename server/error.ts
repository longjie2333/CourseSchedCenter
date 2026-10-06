import { HTTPError } from 'h3'
import { defineErrorHandler } from 'nitro'
import { ZodError } from 'zod'
import { adminError, AppError, publicFail, zodError } from './utils/http.ts'

const zodCause = (error: HTTPError) => (error.cause instanceof ZodError ? error.cause : null)
const invalidJson = (error: HTTPError) => error.cause instanceof SyntaxError

export default defineErrorHandler((error, event) => {
  const pathname = new URL(event.req.url).pathname

  if (!pathname.startsWith('/api/')) {
    if (zodCause(error) && pathname === '/feedback') return publicFail(400)('反馈数据格式不正确')()

    if (error instanceof AppError && error.code === 'WECHAT_CODE_INVALID')
      return publicFail(400)('登录凭证无效或已过期')()

    if (invalidJson(error) || error.status === 400) return publicFail(400)('请求体必须是有效的 JSON')()

    console.error('公开接口请求失败:', error)

    return publicFail(500)('服务暂时不可用，请稍后重试')()
  }

  const validationError = zodCause(error)

  if (validationError) {
    const converted = zodError(validationError)
    return adminError(converted.status)(converted.code)(converted.message)(converted.fields)
  }

  if (error instanceof AppError) return adminError(error.status)(error.code)(error.message)(error.fields)

  if (invalidJson(error) || error.status === 400) return adminError(400)('INVALID_INPUT')('请求体必须是有效的 JSON')()

  console.error('未处理的服务端错误:', error)

  return adminError(500)('INTERNAL_ERROR')('服务暂时不可用，请稍后重试')()
})

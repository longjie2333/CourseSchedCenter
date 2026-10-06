import { HTTPError } from 'h3'
import { ZodError } from 'zod'

const headers = { 'cache-control': 'no-store' }

export class AppError extends HTTPError {
  code: string
  fields?: Record<string, string>

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message, { status })
    this.code = code
    this.fields = fields
  }
}

const publicResponse =
  (status: number) =>
  (msg: string) =>
  (data: unknown = null) =>
    Response.json(
      {
        code: status,
        msg,
        data,
      },
      { status, headers },
    )

const adminResponse = (status: number) => (data: unknown) => Response.json({ data }, { status, headers })

export const publicOk = publicResponse(200)

export const publicFail = publicResponse

export const adminOk = adminResponse(200)

export const adminError =
  (status: number) => (code: string) => (message: string) => (fields?: Record<string, string>) =>
    Response.json(
      {
        error: {
          code,
          message,
          ...(fields ? { fields } : {}),
        },
      },
      { status, headers },
    )

export const zodError = (error: ZodError) => {
  const fields: Record<string, string> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'body'
    fields[key] ||= issue.message
  }

  return new AppError(400, 'INVALID_INPUT', error.issues[0]?.message || '请求参数不正确', fields)
}

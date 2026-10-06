import { useState } from 'react'
import { Button } from '~/components/ui/button.tsx'
import { Field, FieldError, FieldLabel } from '~/components/ui/field.tsx'
import { Frame, FramePanel } from '~/components/ui/frame.tsx'
import { OTPField, OTPFieldInput } from '~/components/ui/otp-field.tsx'
import { adminApi, ApiError } from '../admin-api.ts'
import { saveSession } from './session.ts'

const CODE_LENGTH = 6

export function LoginView({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(value: string) {
    if (!/^\d{6}$/.test(value)) {
      setError('请输入 6 位数字验证码')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const session = await adminApi.login(value)
      saveSession(session.token, session.expiresAt)
      onAuthenticated()
    } catch (cause) {
      setCode('')
      setError(cause instanceof ApiError ? cause.message : '网络异常，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Frame className="w-full max-w-88">
        <FramePanel className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground text-sm">
              JW
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="font-semibold text-base">公告与反馈管理台</h1>
              <p className="text-muted-foreground text-sm">输入身份验证器中的 6 位动态验证码</p>
            </div>
          </div>

          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void submit(code)
            }}
          >
            <Field className="items-center" invalid={Boolean(error)}>
              <FieldLabel className="sr-only">动态验证码</FieldLabel>
              <OTPField
                aria-label="动态验证码"
                disabled={submitting}
                length={CODE_LENGTH}
                onValueChange={(value) => {
                  setCode(value)
                  setError('')
                }}
                onValueComplete={(value) => void submit(value)}
                value={code}
              >
                {Array.from({ length: CODE_LENGTH }, (_, index) => (
                  <OTPFieldInput aria-label={`第 ${index + 1} 位验证码`} autoFocus={index === 0} key={index} />
                ))}
              </OTPField>
              <FieldError match={true}>{error}</FieldError>
            </Field>

            <Button loading={submitting} size="lg" type="submit">
              {submitting ? '正在验证…' : '验证并登录'}
            </Button>
          </form>
        </FramePanel>
      </Frame>
    </div>
  )
}

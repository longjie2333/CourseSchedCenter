import { AppError } from '../../utils/http.ts'
import { WeChat } from '../../utils/wechat.ts'
import { useRuntimeConfig } from 'nitro/runtime-config'
import type { z } from 'zod'
import {
  claimReply,
  findFeedback,
  insertFeedback,
  markReplyFailure,
  markReplySuccess,
  type FeedbackDetail,
} from './repository.ts'
import type { feedbackSchema } from './schemas.ts'

const config = useRuntimeConfig()
const wechat = WeChat(config.wcmpAppid, config.wcmpSecret)

const truncateThing = (value: string): string => {
  const chars = [...value]
  return chars.length <= 20 ? value : `${chars.slice(0, 17).join('')}...`
}

export const createFeedback = async (input: z.infer<typeof feedbackSchema>) => {
  let openid: string

  try {
    openid = await wechat.codeToOpenid(input.code)
  } catch (error) {
    if (error instanceof Error && error.message === '登录凭证无效或已过期') {
      throw new AppError(400, 'WECHAT_CODE_INVALID', error.message)
    }

    throw error
  }

  await insertFeedback({
    openid,
    config: input.config ?? '',
    contact: input.contact ?? null,
    content: input.content,
    report: input.report ?? null,
    answer: input.answer ?? null,
    files: input.files ?? [],
  })

  if (config.feedbackHook) {
    const url = config.feedbackHook.replace(/<(\w+)>/g, (placeholder, key: string) => {
      if (key === 'contact') return input.contact ?? ''
      if (key === 'content') return input.content
      return placeholder
    })
    void fetch(url).catch(() => {})
  }
}

export const replyFeedback = async (id: number, content: string): Promise<FeedbackDetail> => {
  const now = new Date().toISOString()
  const stale = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const claim = await claimReply(id, now, stale)

  if (claim.changes !== 1) {
    const current = await findFeedback(id)

    if (!current) {
      throw new AppError(404, 'NOT_FOUND', '反馈不存在')
    }

    if (current.replyStatus === 'replied') {
      throw new AppError(409, 'ALREADY_REPLIED', '该反馈已回复，不能重复回复')
    }

    throw new AppError(409, 'REPLY_IN_PROGRESS', '该反馈正在发送回复')
  }

  const current = await findFeedback(id)

  if (!current) {
    await markReplyFailure(id, '反馈不存在')
    throw new AppError(404, 'NOT_FOUND', '反馈不存在')
  }

  try {
    const result = await wechat.sendSubscribeMessage({
      openid: current.openid,
      templateId: config.wcmpTemplateId,
      data: {
        time4: {
          value: new Intl.DateTimeFormat('zh-CN', {
            timeZone: 'Asia/Shanghai',
            dateStyle: 'short',
            timeStyle: 'medium',
          }).format(new Date(current.createdAt)),
        },
        thing2: {
          value: truncateThing(current.content),
        },
        thing3: { value: truncateThing(content) },
      },
    })

    await markReplySuccess(id, content, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : '微信发送失败'

    await markReplyFailure(id, message)

    throw new AppError(502, 'WECHAT_ERROR', message)
  }

  const updated = await findFeedback(id)

  if (!updated) {
    throw new AppError(404, 'NOT_FOUND', '反馈不存在')
  }

  return updated
}

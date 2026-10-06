import { z } from 'zod'

export const feedbackSchema = z.object({
  code: z.string().min(1, 'code 不能为空').max(128, 'code 过长'),
  config: z.string().max(100000, 'config 过长').optional(),
  contact: z.string().max(200, '联系方式过长').optional(),
  content: z.string().trim().min(1, '请填写反馈内容').max(50000, '反馈内容不能超过 50000 个字符'),
  report: z.record(z.string(), z.unknown()).optional(),
  answer: z.boolean().optional(),
  files: z
    .array(z.string().regex(new RegExp('^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=\\s]+$')))
    .max(3, '截图最多 3 张')
    .optional(),
})

export const replySchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '回复内容不能为空')
    .refine((value) => [...value].length <= 20, { message: '回复内容不能超过 20 个字符' }),
})

export const feedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['all', 'pending', 'sending', 'replied', 'failed']).default('all'),
})

export type ReplyStatus = 'pending' | 'sending' | 'replied' | 'failed'

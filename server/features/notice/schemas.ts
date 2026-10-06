import { z } from 'zod'

const dialogText = z.string().trim().max(50, '标题不能超过 50 个字符')
const dialogContent = z.string().trim().max(1000, '内容不能超过 1000 个字符')
const buttonText = z.string().trim().min(1, '按钮文字不能为空').max(10, '按钮文字不能超过 10 个字符')
const iconObject = z.record(z.string(), z.unknown())

export const dialogSchema = z
  .object({
    title: dialogText,
    content: dialogContent,
    confirmBtn: buttonText.optional(),
    cancelBtn: buttonText.optional(),
    closeOnOverlayClick: z.boolean(),
    showOverlay: z.boolean(),
    preventScrollThrough: z.boolean(),
    zIndex: z.number().int().min(1).max(99999).optional(),
    overlayProps: z
      .object({
        backgroundColor: z.string().max(50).optional(),
        duration: z.number().int().min(0).max(10000).optional(),
        zIndex: z.number().int().min(1).max(99999).optional(),
        preventScrollThrough: z.boolean().optional(),
        usingCustomNavbar: z.boolean().optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.title.length > 0 !== value.content.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: '标题与内容需要同时填写或同时清空',
        path: value.title.length > 0 ? ['content'] : ['title'],
      })
    }
  })

export const barSchema = z.object({
  content: z.union([
    z.string().trim().max(1000, '内容不能超过 1000 个字符'),
    z.array(z.string().trim().min(1, '轮播内容不能为空').max(200, '单条轮播内容不能超过 200 个字符')).min(1).max(20),
  ]),
  direction: z.enum(['horizontal', 'vertical']).optional(),
  interval: z.number().int().min(500).max(60000).optional(),
  marquee: z
    .union([
      z.boolean(),
      z.object({
        speed: z.number().int().min(1).max(1000).optional(),
        loop: z.number().int().min(-1).max(999).optional(),
        delay: z.number().int().min(0).max(60000).optional(),
      }),
    ])
    .optional(),
  operation: z.string().trim().min(1, '入口文字不能为空').max(20).optional(),
  prefixIcon: z.union([z.string().trim().min(1).max(50), z.boolean(), iconObject]).optional(),
  suffixIcon: z.union([z.string().trim().min(1).max(50), iconObject]).optional(),
  theme: z.enum(['info', 'success', 'warning', 'error']).optional(),
  visible: z.boolean().optional(),
  defaultVisible: z.boolean().optional(),
})

export const noticeSaveSchema = z
  .object({ dialog: dialogSchema.optional(), bar: barSchema.optional() })
  .refine((value) => value.dialog || value.bar, { message: '至少需要配置一种公告' })
export const noticeSchema = z
  .object({
    dialog: dialogSchema.extend({ pubdate: z.string().min(1) }).optional(),
    bar: barSchema.extend({ pubdate: z.string().min(1) }).optional(),
  })
  .refine((value) => value.dialog || value.bar, { message: '至少需要配置一种公告' })

export type Notice = z.infer<typeof noticeSchema>
export type NoticeSave = z.infer<typeof noticeSaveSchema>
export type NoticeHistory = { mode: 'dialog' | 'bar'; notice: Notice; updatedAt: string }

import type { BarConfig, DialogConfig, NoticeHistoryItem, NoticeMode, NoticePayload } from '../../admin-api.ts'

export type EnabledModes = Record<NoticeMode, boolean>

export interface DialogFormState {
  title: string
  content: string
  confirmBtn: string
  cancelBtn: string
  closeOnOverlayClick: boolean
  showOverlay: boolean
  preventScrollThrough: boolean
  zIndex: string
  overlayBackgroundColor: string
  overlayDuration: string
  overlayZIndex: string
  overlayPreventScrollThrough: boolean
  overlayUsingCustomNavbar: boolean
}

export interface BarFormState {
  content: string
  direction: 'horizontal' | 'vertical'
  interval: string
  marqueeMode: 'false' | 'true' | 'custom'
  marqueeSpeed: string
  marqueeLoop: string
  marqueeDelay: string
  operation: string
  prefixIconMode: 'default' | 'hidden' | 'name' | 'object'
  prefixIconName: string
  prefixIconJson: string
  suffixIconMode: 'none' | 'name' | 'object'
  suffixIconName: string
  suffixIconJson: string
  theme: 'info' | 'success' | 'warning' | 'error'
  visible: boolean
  defaultVisible: boolean
}

export interface FormState {
  dialog: DialogFormState
  bar: BarFormState
}

export const emptyDialogForm: DialogFormState = {
  title: '',
  content: '',
  confirmBtn: '确定',
  cancelBtn: '取消',
  closeOnOverlayClick: false,
  showOverlay: true,
  preventScrollThrough: true,
  zIndex: '11500',
  overlayBackgroundColor: '',
  overlayDuration: '',
  overlayZIndex: '',
  overlayPreventScrollThrough: true,
  overlayUsingCustomNavbar: false,
}

export const emptyBarForm: BarFormState = {
  content: '',
  direction: 'horizontal',
  interval: '2000',
  marqueeMode: 'false',
  marqueeSpeed: '50',
  marqueeLoop: '-1',
  marqueeDelay: '0',
  operation: '',
  prefixIconMode: 'default',
  prefixIconName: '',
  prefixIconJson: '',
  suffixIconMode: 'none',
  suffixIconName: '',
  suffixIconJson: '',
  theme: 'info',
  visible: true,
  defaultVisible: true,
}

export const emptyForm: FormState = {
  dialog: emptyDialogForm,
  bar: emptyBarForm,
}

export const emptyEnabledModes: EnabledModes = {
  dialog: false,
  bar: false,
}

export function modesFromNotice(notice: NoticePayload | null): EnabledModes {
  return {
    dialog: Boolean(notice?.dialog),
    bar: Boolean(notice?.bar),
  }
}

function isIntegerInRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max
}

export function formToDialog(form: DialogFormState): DialogConfig {
  const zIndex = Number(form.zIndex)
  const overlayProps: NonNullable<DialogConfig['overlayProps']> = {}
  const overlayDuration = Number(form.overlayDuration)
  const overlayZIndex = Number(form.overlayZIndex)

  if (form.overlayBackgroundColor.trim()) overlayProps.backgroundColor = form.overlayBackgroundColor.trim()
  if (isIntegerInRange(overlayDuration, 0, 10000)) overlayProps.duration = overlayDuration
  if (isIntegerInRange(overlayZIndex, 1, 99999)) overlayProps.zIndex = overlayZIndex
  if (!form.overlayPreventScrollThrough) overlayProps.preventScrollThrough = false
  if (form.overlayUsingCustomNavbar) overlayProps.usingCustomNavbar = true

  return {
    title: form.title.trim(),
    content: form.content.trim(),
    ...(form.confirmBtn.trim() ? { confirmBtn: form.confirmBtn.trim() } : {}),
    ...(form.cancelBtn.trim() ? { cancelBtn: form.cancelBtn.trim() } : {}),
    closeOnOverlayClick: form.closeOnOverlayClick,
    showOverlay: form.showOverlay,
    preventScrollThrough: form.preventScrollThrough,
    ...(isIntegerInRange(zIndex, 1, 99999) ? { zIndex } : {}),
    ...(Object.keys(overlayProps).length > 0 ? { overlayProps } : {}),
  }
}

export function formFromDialog(dialog?: DialogConfig): DialogFormState {
  if (!dialog) return emptyDialogForm
  return {
    title: dialog.title,
    content: dialog.content,
    confirmBtn: dialog.confirmBtn ?? '',
    cancelBtn: dialog.cancelBtn ?? '',
    closeOnOverlayClick: dialog.closeOnOverlayClick,
    showOverlay: dialog.showOverlay,
    preventScrollThrough: dialog.preventScrollThrough,
    zIndex: dialog.zIndex ? String(dialog.zIndex) : '',
    overlayBackgroundColor: dialog.overlayProps?.backgroundColor ?? '',
    overlayDuration: dialog.overlayProps?.duration !== undefined ? String(dialog.overlayProps.duration) : '',
    overlayZIndex: dialog.overlayProps?.zIndex !== undefined ? String(dialog.overlayProps.zIndex) : '',
    overlayPreventScrollThrough: dialog.overlayProps?.preventScrollThrough !== false,
    overlayUsingCustomNavbar: dialog.overlayProps?.usingCustomNavbar === true,
  }
}

export function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function barContentItems(form: BarFormState): string[] {
  return form.content
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function barContentFromForm(form: BarFormState): BarConfig['content'] {
  if (form.content.trim().length === 0) return ''
  return form.direction === 'vertical' ? barContentItems(form) : form.content.trim()
}

export function formToBar(form: BarFormState): BarConfig {
  const interval = Number(form.interval)
  const marqueeSpeed = Number(form.marqueeSpeed)
  const marqueeLoop = Number(form.marqueeLoop)
  const marqueeDelay = Number(form.marqueeDelay)
  const bar: BarConfig = {
    content: barContentFromForm(form),
    direction: form.direction,
    theme: form.theme,
    visible: form.visible,
    defaultVisible: form.defaultVisible,
  }

  if (isIntegerInRange(interval, 500, 60000)) bar.interval = interval
  if (form.marqueeMode === 'true') bar.marquee = true
  if (form.marqueeMode === 'false') bar.marquee = false
  if (form.marqueeMode === 'custom') {
    bar.marquee = {
      ...(isIntegerInRange(marqueeSpeed, 1, 1000) ? { speed: marqueeSpeed } : {}),
      ...(isIntegerInRange(marqueeLoop, -1, 999) ? { loop: marqueeLoop } : {}),
      ...(isIntegerInRange(marqueeDelay, 0, 60000) ? { delay: marqueeDelay } : {}),
    }
  }
  if (form.operation.trim()) bar.operation = form.operation.trim()
  if (form.prefixIconMode === 'default') bar.prefixIcon = true
  if (form.prefixIconMode === 'hidden') bar.prefixIcon = false
  if (form.prefixIconMode === 'name' && form.prefixIconName.trim()) bar.prefixIcon = form.prefixIconName.trim()
  if (form.prefixIconMode === 'object') {
    const icon = parseJsonObject(form.prefixIconJson)
    if (icon) bar.prefixIcon = icon
  }
  if (form.suffixIconMode === 'name' && form.suffixIconName.trim()) bar.suffixIcon = form.suffixIconName.trim()
  if (form.suffixIconMode === 'object') {
    const icon = parseJsonObject(form.suffixIconJson)
    if (icon) bar.suffixIcon = icon
  }

  return bar
}

export function formFromBar(bar?: BarConfig): BarFormState {
  if (!bar) return emptyBarForm
  const prefixIcon = bar.prefixIcon
  const suffixIcon = bar.suffixIcon
  const marquee = bar.marquee
  const customMarquee = typeof marquee === 'object' && marquee ? marquee : null

  return {
    content: Array.isArray(bar.content) ? bar.content.join('\n') : bar.content,
    direction: bar.direction ?? (Array.isArray(bar.content) ? 'vertical' : 'horizontal'),
    interval: bar.interval !== undefined ? String(bar.interval) : '2000',
    marqueeMode: customMarquee ? 'custom' : marquee ? 'true' : 'false',
    marqueeSpeed: customMarquee?.speed !== undefined ? String(customMarquee.speed) : '50',
    marqueeLoop: customMarquee?.loop !== undefined ? String(customMarquee.loop) : '-1',
    marqueeDelay: customMarquee?.delay !== undefined ? String(customMarquee.delay) : '0',
    operation: bar.operation ?? '',
    prefixIconMode:
      prefixIcon === false
        ? 'hidden'
        : typeof prefixIcon === 'string'
          ? 'name'
          : typeof prefixIcon === 'object' && prefixIcon
            ? 'object'
            : 'default',
    prefixIconName: typeof prefixIcon === 'string' ? prefixIcon : '',
    prefixIconJson: typeof prefixIcon === 'object' && prefixIcon ? JSON.stringify(prefixIcon, null, 2) : '',
    suffixIconMode:
      typeof suffixIcon === 'string' ? 'name' : typeof suffixIcon === 'object' && suffixIcon ? 'object' : 'none',
    suffixIconName: typeof suffixIcon === 'string' ? suffixIcon : '',
    suffixIconJson: typeof suffixIcon === 'object' && suffixIcon ? JSON.stringify(suffixIcon, null, 2) : '',
    theme: bar.theme ?? 'info',
    visible: bar.visible !== false,
    defaultVisible: bar.defaultVisible !== false,
  }
}

export function formFromNotice(notice: NoticePayload | null): FormState {
  return {
    dialog: formFromDialog(notice?.dialog),
    bar: formFromBar(notice?.bar),
  }
}

export function hasDialogContent(form: DialogFormState): boolean {
  return Boolean(form.title.trim() || form.content.trim())
}

export function hasBarContent(form: BarFormState): boolean {
  return Boolean(form.content.trim())
}

export function validateDialogForm(form: DialogFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  const hasTitle = form.title.trim().length > 0
  const hasContent = form.content.trim().length > 0

  if (hasTitle !== hasContent) {
    if (!hasTitle) errors.title = '标题不能为空'
    if (!hasContent) errors.content = '内容不能为空'
  }
  if (form.title.length > 50) errors.title = '标题不能超过 50 个字符'
  if (form.content.length > 1000) errors.content = '内容不能超过 1000 个字符'
  if (form.confirmBtn.trim().length > 10) errors.confirmBtn = '确认按钮文字不能超过 10 个字符'
  if (form.cancelBtn.trim().length > 10) errors.cancelBtn = '取消按钮文字不能超过 10 个字符'

  const zIndex = Number(form.zIndex)
  const overlayDuration = Number(form.overlayDuration)
  const overlayZIndex = Number(form.overlayZIndex)
  if (form.zIndex.trim() !== '' && !isIntegerInRange(zIndex, 1, 99999)) {
    errors.zIndex = 'zIndex 必须是 1-99999 的整数'
  }
  if (form.overlayBackgroundColor.trim().length > 50) errors.overlayBackgroundColor = '背景色不能超过 50 个字符'
  if (form.overlayDuration.trim() !== '' && !isIntegerInRange(overlayDuration, 0, 10000)) {
    errors.overlayDuration = 'duration 必须是 0-10000 的整数（毫秒）'
  }
  if (form.overlayZIndex.trim() !== '' && !isIntegerInRange(overlayZIndex, 1, 99999)) {
    errors.overlayZIndex = 'zIndex 必须是 1-99999 的整数'
  }
  return errors
}

export function validateBarForm(form: BarFormState): Record<string, string> {
  const errors: Record<string, string> = {}
  const contentItems = form.direction === 'vertical' ? barContentItems(form) : [form.content.trim()].filter(Boolean)

  if (form.direction === 'vertical' && contentItems.length > 20) errors.barContent = '轮播内容不能超过 20 条'
  if (form.direction === 'horizontal' && form.content.length > 1000) errors.barContent = '内容不能超过 1000 个字符'
  if (form.direction === 'vertical' && contentItems.some((item) => item.length > 200)) {
    errors.barContent = '单条轮播内容不能超过 200 个字符'
  }

  const interval = Number(form.interval)
  if (form.interval.trim() !== '' && !isIntegerInRange(interval, 500, 60000)) {
    errors.interval = '切换间隔必须是 500-60000 的整数（毫秒）'
  }
  if (form.operation.trim().length > 20) errors.operation = '操作文字不能超过 20 个字符'
  if (form.prefixIconName.trim().length > 50) errors.prefixIconName = '图标名称不能超过 50 个字符'
  if (form.suffixIconName.trim().length > 50) errors.suffixIconName = '图标名称不能超过 50 个字符'
  if (form.prefixIconMode === 'object' && !parseJsonObject(form.prefixIconJson))
    errors.prefixIconJson = '请输入 JSON 对象'
  if (form.suffixIconMode === 'object' && !parseJsonObject(form.suffixIconJson))
    errors.suffixIconJson = '请输入 JSON 对象'
  if (form.marqueeMode === 'custom') {
    const speed = Number(form.marqueeSpeed)
    const loop = Number(form.marqueeLoop)
    const delay = Number(form.marqueeDelay)
    if (form.marqueeSpeed.trim() !== '' && !isIntegerInRange(speed, 1, 1000)) {
      errors.marqueeSpeed = '滚动速度必须是 1-1000 的整数'
    }
    if (form.marqueeLoop.trim() !== '' && !isIntegerInRange(loop, -1, 999)) {
      errors.marqueeLoop = '滚动次数必须是 -1-999 的整数'
    }
    if (form.marqueeDelay.trim() !== '' && !isIntegerInRange(delay, 0, 60000)) {
      errors.marqueeDelay = '滚动延迟必须是 0-60000 的整数（毫秒）'
    }
  }
  return errors
}

export function buildPayload(form: FormState, enabledModes: EnabledModes): NoticePayload | null {
  const payload: NoticePayload = {}
  if (enabledModes.dialog) payload.dialog = formToDialog(form.dialog)
  if (enabledModes.bar) payload.bar = formToBar(form.bar)
  return payload.dialog || payload.bar ? payload : null
}

export function activeModeHasContent(form: FormState, mode: NoticeMode): boolean {
  return mode === 'dialog' ? hasDialogContent(form.dialog) : hasBarContent(form.bar)
}

export function barPreviewItems(config: BarConfig): string[] {
  const items = Array.isArray(config.content) ? config.content : [config.content]
  return items.map((item) => item.trim()).filter(Boolean)
}

export function barPreviewVisible(config: BarConfig): boolean {
  if (typeof config.visible === 'boolean') return config.visible
  return typeof config.defaultVisible === 'boolean' ? config.defaultVisible : true
}

export interface BarMarqueePreview {
  speed: number
  loop: number
  delay: number
}

export function barMarqueePreview(marquee: BarConfig['marquee']): BarMarqueePreview | null {
  if (marquee === true) return { speed: 50, loop: -1, delay: 0 }
  if (typeof marquee === 'object' && marquee) {
    return { speed: marquee.speed ?? 50, loop: marquee.loop ?? -1, delay: marquee.delay ?? 0 }
  }
  return null
}

export function iconNameFromValue(icon: BarConfig['prefixIcon'] | BarConfig['suffixIcon']): string | null {
  if (typeof icon === 'string') return icon
  if (icon && typeof icon === 'object' && !Array.isArray(icon)) {
    const name = (icon as Record<string, unknown>).name
    return typeof name === 'string' ? name : null
  }
  return null
}

export function historyTitle(item: NoticeHistoryItem): string {
  if (item.mode === 'dialog') return item.notice.dialog?.title || '空公告弹窗'
  const content = item.notice.bar?.content
  if (Array.isArray(content)) return content.find((line) => line.trim()) ?? '空公告栏'
  if (content?.trim()) return content
  return '空公告栏'
}

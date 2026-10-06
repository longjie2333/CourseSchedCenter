import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button.tsx'
import { FrameDescription, FrameFooter, FrameHeader, FrameTitle } from '~/components/ui/frame.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { Skeleton } from '~/components/ui/skeleton.tsx'
import {
  adminApi,
  ApiError,
  formatDateTime,
  type NoticeHistoryItem,
  type NoticeMode,
  type NoticePayload,
} from '../../admin-api.ts'
import { Column, ColumnBody, ColumnGrid } from '../column.tsx'
import { ConfirmDialog } from '../confirm-dialog.tsx'
import { NoticeBarFields } from './notice-bar-fields.tsx'
import { NoticeDialogFields } from './notice-dialog-fields.tsx'
import {
  activeModeHasContent,
  type BarFormState,
  buildPayload,
  type DialogFormState,
  emptyEnabledModes,
  emptyForm,
  type EnabledModes,
  formFromBar,
  formFromDialog,
  formFromNotice,
  type FormState,
  formToBar,
  formToDialog,
  modesFromNotice,
  validateBarForm,
  validateDialogForm,
} from './notice-form.ts'
import { NoticeHistory } from './notice-history.tsx'
import { NoticePreview } from './notice-preview.tsx'
import { notify } from '../notify.ts'

interface SavedState {
  notice: NoticePayload | null
  updatedAt: string | null
  history: NoticeHistoryItem[]
}

const emptySaved: SavedState = { history: [], notice: null, updatedAt: null }

export function NoticeView({
  mode,
  onDirtyChange,
  onModeChange,
  onUnauthorized,
}: {
  mode: NoticeMode
  onDirtyChange: (dirty: boolean) => void
  onModeChange: (mode: NoticeMode) => void
  onUnauthorized: () => void
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [enabledModes, setEnabledModes] = useState<EnabledModes>(emptyEnabledModes)
  const [saved, setSaved] = useState<SavedState>(emptySaved)
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState<NoticeMode | null>(null)
  const [confirmClearMode, setConfirmClearMode] = useState<NoticeMode | null>(null)

  const dialogErrors = useMemo(() => validateDialogForm(form.dialog), [form.dialog])
  const barErrors = useMemo(() => validateBarForm(form.bar), [form.bar])
  const activeErrors = mode === 'dialog' ? dialogErrors : barErrors
  const hasErrors = Object.keys(dialogErrors).length > 0 || Object.keys(barErrors).length > 0
  const payload = useMemo(() => buildPayload(form, enabledModes), [form, enabledModes])
  const dirty = useMemo(() => {
    const savedState = { enabledModes: modesFromNotice(saved.notice), form: formFromNotice(saved.notice) }
    return JSON.stringify({ enabledModes, form }) !== JSON.stringify(savedState)
  }, [enabledModes, form, saved.notice])
  const dialogPreview = useMemo(() => formToDialog(form.dialog), [form.dialog])
  const barPreview = useMemo(() => formToBar(form.bar), [form.bar])
  const activeHistory = useMemo(() => saved.history.filter((item) => item.mode === mode), [mode, saved.history])

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const loadNotice = useCallback(async () => {
    setStatus('loading')
    try {
      const response = await adminApi.getNotice()
      setSaved({ history: response.history, notice: response.notice, updatedAt: response.updatedAt })
      setForm(formFromNotice(response.notice))
      setEnabledModes(modesFromNotice(response.notice))
      setStatus('ready')
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized()
        return
      }
      setStatus('error')
    }
  }, [onUnauthorized])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (!cancelled) await loadNotice()
    })()
    return () => {
      cancelled = true
    }
  }, [loadNotice])

  const updateDialog = useCallback((patch: Partial<DialogFormState>) => {
    setEnabledModes((prev) => ({ ...prev, dialog: true }))
    setForm((prev) => ({ ...prev, dialog: { ...prev.dialog, ...patch } }))
  }, [])

  const updateBar = useCallback((patch: Partial<BarFormState>) => {
    setEnabledModes((prev) => ({ ...prev, bar: true }))
    setForm((prev) => ({ ...prev, bar: { ...prev.bar, ...patch } }))
  }, [])

  function applySavedState(notice: NoticePayload | null) {
    setForm(formFromNotice(notice))
    setEnabledModes(modesFromNotice(notice))
  }

  async function handleSave() {
    if (hasErrors) {
      notify('请检查表单错误', 'error')
      return
    }
    if (!payload) {
      notify('请先填写公告内容', 'error')
      return
    }
    setSaving(true)
    try {
      const response = await adminApi.saveNotice(payload)
      setSaved({ history: response.history, notice: response.notice, updatedAt: response.updatedAt })
      applySavedState(response.notice)
      notify('公告已发布')
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onUnauthorized()
      else notify(cause instanceof Error ? cause.message : '保存失败，请稍后重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleClearMode() {
    if (!confirmClearMode) return
    const nextForm: FormState =
      confirmClearMode === 'dialog'
        ? { ...form, dialog: { ...form.dialog, content: '', title: '' } }
        : { ...form, bar: { ...form.bar, content: '' } }
    const nextEnabledModes = { ...enabledModes, [confirmClearMode]: true }
    const nextPayload = buildPayload(nextForm, nextEnabledModes)
    if (!nextPayload) return

    setClearing(confirmClearMode)
    try {
      const response = await adminApi.saveNotice(nextPayload)
      setSaved({ history: response.history, notice: response.notice, updatedAt: response.updatedAt })
      applySavedState(response.notice)
      notify(confirmClearMode === 'dialog' ? '公告弹窗已清空' : '公告栏已清空')
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) onUnauthorized()
      else notify(cause instanceof Error ? cause.message : '清空失败，请稍后重试', 'error')
    } finally {
      setClearing(null)
      setConfirmClearMode(null)
    }
  }

  function handleRestore() {
    applySavedState(saved.notice)
    notify('已恢复为已保存内容', 'info')
  }

  function handleHistoryApply(item: NoticeHistoryItem) {
    if (item.mode === 'dialog' && item.notice.dialog) {
      onModeChange('dialog')
      setEnabledModes((prev) => ({ ...prev, dialog: true }))
      setForm((prev) => ({ ...prev, dialog: formFromDialog(item.notice.dialog) }))
      notify('已载入历史公告弹窗', 'info')
      return
    }
    if (item.mode === 'bar' && item.notice.bar) {
      onModeChange('bar')
      setEnabledModes((prev) => ({ ...prev, bar: true }))
      setForm((prev) => ({ ...prev, bar: formFromBar(item.notice.bar) }))
      notify('已载入历史公告栏', 'info')
    }
  }

  return (
    <ColumnGrid>
      <NoticeHistory items={activeHistory} mode={mode} onApply={handleHistoryApply} />

      <Column>
        <FrameHeader className="shrink-0 flex-row items-center justify-between gap-4 border-b">
          <FrameTitle className="shrink-0">公告编辑器</FrameTitle>
          <FrameDescription className="min-w-0 truncate text-xs">
            {saved.notice ? `最后更新：${formatDateTime(saved.updatedAt)}` : '当前未发布公告'}
          </FrameDescription>
        </FrameHeader>

        <ColumnBody>
          <ScrollArea scrollbarGutter={true}>
            <div className="flex flex-col gap-6 p-5">
              {status === 'loading' && (
                <>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-48" />
                </>
              )}

              {status === 'error' && (
                <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/32 bg-destructive/4 p-4">
                  <p className="text-destructive-foreground text-sm">公告加载失败，请重试。</p>
                  <Button onClick={() => void loadNotice()} variant="secondary">
                    重试
                  </Button>
                </div>
              )}

              {status === 'ready' &&
                (mode === 'dialog' ? (
                  <NoticeDialogFields errors={activeErrors} form={form.dialog} update={updateDialog} />
                ) : (
                  <NoticeBarFields errors={activeErrors} form={form.bar} update={updateBar} />
                ))}
            </div>
          </ScrollArea>
        </ColumnBody>

        {status === 'ready' && (
          <FrameFooter className="flex shrink-0 flex-wrap gap-2 border-t">
            <Button disabled={!dirty || hasErrors || !payload} loading={saving} onClick={() => void handleSave()}>
              保存并发布
            </Button>
            <Button disabled={!dirty} onClick={handleRestore} variant="secondary">
              恢复已保存内容
            </Button>
            <Button
              disabled={!activeModeHasContent(form, mode)}
              onClick={() => setConfirmClearMode(mode)}
              variant="destructive-outline"
            >
              {mode === 'dialog' ? '清空公告弹窗' : '清空公告栏'}
            </Button>
          </FrameFooter>
        )}
      </Column>

      <NoticePreview bar={barPreview} dialog={dialogPreview} mode={mode} payload={payload} />

      <ConfirmDialog
        busy={clearing !== null}
        confirmLabel="确认清空"
        danger={true}
        message="清空后仅移除当前模式的标题和内容，其他设置会继续保存。"
        onConfirm={() => void handleClearMode()}
        onOpenChange={(open) => {
          if (!open) setConfirmClearMode(null)
        }}
        open={Boolean(confirmClearMode)}
        title={confirmClearMode === 'bar' ? '清空公告栏' : '清空公告弹窗'}
      />
    </ColumnGrid>
  )
}

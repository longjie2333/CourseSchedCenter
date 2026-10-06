import { CheckIcon, ChevronDownIcon, CopyIcon, MousePointerClickIcon } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { Button } from '~/components/ui/button.tsx'
import { Dialog, DialogHeader, DialogPanel, DialogPopup, DialogTitle } from '~/components/ui/dialog.tsx'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '~/components/ui/empty.tsx'
import { FrameDescription, FrameHeader, FrameTitle } from '~/components/ui/frame.tsx'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '~/components/ui/collapsible.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import { Skeleton } from '~/components/ui/skeleton.tsx'
import { Textarea } from '~/components/ui/textarea.tsx'
import { adminApi, ApiError, type FeedbackDetail, formatDateTime } from '../../admin-api.ts'
import { Column, ColumnBody } from '../column.tsx'
import { ConfirmDialog } from '../confirm-dialog.tsx'
import { FormSection } from '../form-parts.tsx'
import { notify } from '../notify.ts'
import { cn } from '~/lib/utils.ts'

/** The mini-program submits `config` as base64 utf-8; fall back to the raw value. */
function decodeConfigValue(value: string): string {
  if (!value) return ''
  try {
    const binary = atob(value.replace(/\s+/g, ''))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return value
  }
}

/** Replies are limited by code points, matching the server-side schema. */
function countUnicodeChars(value: string): number {
  return [...value].length
}

function InfoRow({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b px-3 py-2 last:border-b-0', className)}>
      <dt className="shrink-0 text-muted-foreground text-xs leading-5">{label}</dt>
      <dd className="min-w-0 flex-1 break-all text-right text-sm leading-5">{children}</dd>
    </div>
  )
}

/**
 * Right-hand column of the feedback view. The parent keys this panel by feedback
 * id, so the draft reply and the lightbox reset whenever another row is selected.
 */
export function FeedbackDetailPanel({
  detail,
  loading,
  onUpdated,
  onRefresh,
  onUnauthorized,
}: {
  detail: FeedbackDetail | null
  loading: boolean
  onUpdated: (detail: FeedbackDetail) => void
  onRefresh: () => void
  onUnauthorized: () => void
}) {
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)

  const replyCharCount = useMemo(() => countUnicodeChars(replyText), [replyText])
  const replyValid = replyCharCount >= 1 && replyCharCount <= 20
  /** The same screenshot can be uploaded twice, so keys carry an occurrence counter. */
  const files = useMemo(() => {
    const seen = new Map<string, number>()
    return (detail?.files ?? []).map((src) => {
      const occurrence = (seen.get(src) ?? 0) + 1
      seen.set(src, occurrence)
      return { key: `${occurrence}-${src}`, src }
    })
  }, [detail?.files])

  async function copyOpenid() {
    if (!detail) return
    try {
      await navigator.clipboard.writeText(detail.openid)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      notify('复制失败', 'error')
    }
  }

  async function handleSend() {
    if (!detail || !replyValid) return
    setConfirmSend(false)
    setSending(true)
    try {
      const updated = await adminApi.replyFeedback(detail.id, replyText)
      onUpdated(updated)
      notify('回复已发送')
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        onUnauthorized()
        return
      }
      notify(cause instanceof Error ? cause.message : '发送失败，请稍后重试', 'error')
      onRefresh()
    } finally {
      setSending(false)
    }
  }

  const configDisplay = detail ? decodeConfigValue(detail.config) : ''
  const configRaw = detail?.config.trim() ?? ''
  const showConfigRow = configRaw !== '' && configRaw !== 'Og=='

  return (
    <Column>
      <FrameHeader className="shrink-0 border-b">
        <FrameTitle>{detail ? `#${detail.id}` : '反馈详情'}</FrameTitle>
        <FrameDescription className="truncate text-xs">
          {detail ? formatDateTime(detail.createdAt) : '选择反馈后展示详情'}
        </FrameDescription>
      </FrameHeader>

      <ColumnBody>
        <ScrollArea scrollbarGutter={true}>
          {loading && !detail && (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          )}

          {!loading && !detail && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MousePointerClickIcon />
                </EmptyMedia>
                <EmptyTitle>请选择一条反馈</EmptyTitle>
                <EmptyDescription>从左侧列表选择反馈查看详情</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {detail && (
            <div className="flex flex-col gap-6 p-5">
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-1 font-semibold text-sm data-panel-open:[&_svg]:rotate-180">
                  配置详情
                  <ChevronDownIcon className="size-4" />
                </CollapsibleTrigger>
                <CollapsiblePanel>
                  <dl className="rounded-xl border mt-2">
                    {detail.contact && <InfoRow label="联系方式">{detail.contact}</InfoRow>}
                    <InfoRow label="接受回复">
                      {detail.answer === true ? '接受' : detail.answer === false ? '不接受' : '未选择'}
                    </InfoRow>
                    <InfoRow label="OpenID" className="items-baseline">
                      <span className="flex flex-wrap items-center justify-end gap-2">
                        <code className="min-w-0 break-all font-mono text-xs">{detail.openid}</code>
                        <Button onClick={() => void copyOpenid()} size="xs" variant="secondary">
                          {copied ? <CheckIcon /> : <CopyIcon />}
                        </Button>
                      </span>
                    </InfoRow>
                    {showConfigRow && (
                      <InfoRow label="配置详情">
                        <code className="break-all font-mono text-xs">{configDisplay || '（空）'}</code>
                      </InfoRow>
                    )}
                  </dl>
                </CollapsiblePanel>
              </Collapsible>

              <FormSection title="反馈内容">
                <p className="whitespace-pre-wrap break-words text-sm leading-6">{detail.content || '（空）'}</p>
              </FormSection>

              {files.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 font-semibold text-sm data-panel-open:[&_svg]:rotate-180">
                    截图附件
                    <ChevronDownIcon className="size-4" />
                  </CollapsibleTrigger>
                  <CollapsiblePanel>
                    <div className="grid grid-cols-3 gap-2">
                      {files.map((file, index) => (
                        <button
                          aria-label={`查看第 ${index + 1} 张截图`}
                          className="overflow-hidden rounded-lg border outline-none transition-colors hover:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                          key={file.key}
                          onClick={() => setLightboxIndex(index)}
                          type="button"
                        >
                          <img
                            alt={`反馈截图 ${index + 1}`}
                            className="aspect-square w-full object-cover"
                            src={file.src}
                          />
                        </button>
                      ))}
                    </div>
                  </CollapsiblePanel>
                </Collapsible>
              )}

              <FormSection title="回复对方">
                {detail.replyStatus === 'replied' && (
                  <div className="flex flex-col gap-1 rounded-xl border bg-muted/40 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm">{detail.replyContent}</p>
                    <p className="text-muted-foreground text-xs">{`已回复于 ${formatDateTime(detail.repliedAt)}`}</p>
                  </div>
                )}

                {detail.replyStatus === 'sending' && (
                  <p className="rounded-xl border bg-muted/40 p-4 text-muted-foreground text-sm">
                    回复正在发送。如该状态持续超过 5 分钟，可刷新后重试。
                  </p>
                )}

                {detail.replyStatus === 'failed' && (
                  <p className="rounded-xl border border-destructive/32 bg-destructive/4 p-4 text-destructive-foreground text-sm">
                    {`上次发送失败：${detail.replyError || '未知错误'}。可修改后重新发送。`}
                  </p>
                )}

                {(detail.replyStatus === 'pending' || detail.replyStatus === 'failed') && (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      disabled={sending}
                      maxLength={20}
                      onChange={(event) => setReplyText(event.target.value)}
                      placeholder="请输入回复内容（最多 20 个字符）"
                      rows={3}
                      value={replyText}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs tabular-nums">{`${replyCharCount} / 20`}</span>
                      <Button disabled={!replyValid} loading={sending} onClick={() => setConfirmSend(true)}>
                        {detail.replyStatus === 'failed' ? '重新发送' : '发送微信回复'}
                      </Button>
                    </div>
                  </div>
                )}
              </FormSection>
            </div>
          )}
        </ScrollArea>
      </ColumnBody>

      <ConfirmDialog
        busy={sending}
        confirmLabel="确认发送"
        message="回复将通过微信订阅消息发送。发送成功后该反馈不能再次回复。"
        onConfirm={() => void handleSend()}
        onOpenChange={(open) => {
          if (!open) setConfirmSend(false)
        }}
        open={confirmSend}
        title="发送微信回复"
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) setLightboxIndex(null)
        }}
        open={lightboxIndex !== null}
      >
        <DialogPopup bottomStickOnMobile={false} className="max-w-3xl" closeProps={{ 'aria-label': '关闭预览' }}>
          <DialogHeader>
            <DialogTitle className="text-base">{`截图预览 ${(lightboxIndex ?? 0) + 1} / ${files.length}`}</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <img
              alt={`反馈截图 ${(lightboxIndex ?? 0) + 1}`}
              className="mx-auto max-h-[70dvh] w-auto rounded-lg"
              src={files[lightboxIndex ?? 0]?.src ?? ''}
            />
          </DialogPanel>
        </DialogPopup>
      </Dialog>
    </Column>
  )
}

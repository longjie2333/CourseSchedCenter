import { InfoIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { FrameHeader, FrameTitle } from '~/components/ui/frame.tsx'
import { ScrollArea } from '~/components/ui/scroll-area.tsx'
import type { BarConfig, DialogConfig, NoticeMode, NoticePayload } from '../../admin-api.ts'
import { Column, ColumnBody } from '../column.tsx'
import { JsonView } from '../json-view.tsx'
import { barMarqueePreview, barPreviewItems, barPreviewVisible, iconNameFromValue } from './notice-form.ts'

const barThemeClass: Record<NonNullable<BarConfig['theme']>, string> = {
  error: 'bg-[#fff0ed] text-[#d54941]',
  info: 'bg-[#ecf2fe] text-[#0052d9]',
  success: 'bg-[#e3f9e9] text-[#2ba471]',
  warning: 'bg-[#fff1e9] text-[#e37318]',
}

/** Stand-in for the mini-program `Dialog`: the same 311px card, overlay and split footer. */
function DialogPreview({ config }: { config: DialogConfig }) {
  const hasFooter = Boolean(config.cancelBtn || config.confirmBtn)

  return (
    <div className="relative flex min-h-56 items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-6">
      {config.showOverlay && (
        <div
          className="absolute inset-0"
          style={{ background: config.overlayProps?.backgroundColor || 'rgba(0, 0, 0, 0.6)' }}
        />
      )}
      <div className="relative w-full max-w-77.75 rounded-2xl bg-background px-6 pt-8 text-center shadow-lg">
        <p className="font-medium text-base">{config.title || '公告标题'}</p>
        <p className="mt-4 whitespace-pre-wrap break-words text-muted-foreground text-sm">
          {config.content || '公告内容'}
        </p>
        {hasFooter ? (
          <div className="-mx-6 mt-6 flex border-t">
            {config.cancelBtn && <span className="flex-1 py-3 text-sm">{config.cancelBtn}</span>}
            {config.confirmBtn && (
              <span className={`flex-1 py-3 text-primary text-sm ${config.cancelBtn ? 'border-l' : ''}`}>
                {config.confirmBtn}
              </span>
            )}
          </div>
        ) : (
          <div className="h-6" />
        )}
      </div>
    </div>
  )
}

function BarIcon({ icon }: { icon: BarConfig['prefixIcon'] | BarConfig['suffixIcon'] }) {
  if (icon === false || icon === undefined) return null
  const name = iconNameFromValue(icon)
  if (name) return <span className="shrink-0 font-mono text-[0.625rem] leading-4 opacity-80">{name}</span>
  return <InfoIcon aria-hidden="true" className="size-4 shrink-0" />
}

/** Horizontal marquee: the element is `w-max`, so the keyframe percentages track the text width. */
function BarMarqueeText({ text, speed, loop, delay }: { text: string; speed: number; loop: number; delay: number }) {
  const textRef = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = textRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setWidth(element.offsetWidth))
    observer.observe(element)
    setWidth(element.offsetWidth)
    return () => observer.disconnect()
  }, [])

  return (
    <span className="min-w-0 flex-1 overflow-hidden">
      <span
        className="block w-max animate-notice-marquee"
        ref={textRef}
        style={{
          animationDelay: `${delay}ms`,
          animationDuration: width > 0 ? `${(width * 2) / speed}s` : '0s',
          animationIterationCount: loop < 0 ? 'infinite' : loop,
        }}
      >
        {text}
      </span>
    </span>
  )
}

function BarPreview({ config }: { config: BarConfig }) {
  const items = barPreviewItems(config)
  const vertical = config.direction === 'vertical'
  const interval = config.interval ?? 2000
  const marquee = barMarqueePreview(config.marquee)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!vertical || items.length < 2) return
    const timer = setInterval(() => setIndex((current) => current + 1), interval)
    return () => clearInterval(timer)
  }, [interval, items.length, vertical])

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border bg-muted/40 p-6">
        <span className="text-muted-foreground text-sm">当前公告栏未显示</span>
      </div>
    )
  }

  if (!barPreviewVisible(config)) {
    return (
      <div className="flex items-center justify-center rounded-xl border bg-muted/40 p-6">
        <span className="text-muted-foreground text-sm">当前公告栏被设为不显示</span>
      </div>
    )
  }

  const text = vertical ? (items[index % items.length] ?? '') : items[0]

  return (
    <div className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm ${barThemeClass[config.theme ?? 'info']}`}>
      <BarIcon icon={config.prefixIcon} />
      {vertical ? (
        <span className="min-w-0 flex-1 truncate fade-in slide-in-from-bottom-2 animate-in" key={index}>
          {text}
        </span>
      ) : marquee ? (
        <BarMarqueeText delay={marquee.delay} loop={marquee.loop} speed={marquee.speed} text={text} />
      ) : (
        <span className="min-w-0 flex-1 truncate">{text}</span>
      )}
      {config.operation && <span className="shrink-0 underline">{config.operation}</span>}
      <BarIcon icon={config.suffixIcon} />
    </div>
  )
}

export function NoticePreview({
  mode,
  dialog,
  bar,
  payload,
}: {
  mode: NoticeMode
  dialog: DialogConfig
  bar: BarConfig
  payload: NoticePayload | null
}) {
  return (
    <Column>
      <FrameHeader className="shrink-0 border-b">
        <FrameTitle>预览</FrameTitle>
      </FrameHeader>
      <ColumnBody>
        <ScrollArea scrollbarGutter={true}>
          <div className="flex flex-col gap-3 p-3">
            {mode === 'dialog' ? <DialogPreview config={dialog} /> : <BarPreview config={bar} />}
            <JsonView src={payload ?? {}} />
          </div>
        </ScrollArea>
      </ColumnBody>
    </Column>
  )
}

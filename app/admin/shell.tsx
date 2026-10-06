import { LogOutIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '~/components/ui/button.tsx'
import { Tabs, TabsList, TabsPanel, TabsTab } from '~/components/ui/tabs.tsx'
import type { NoticeMode } from '../admin-api.ts'
import { ConfirmDialog } from './confirm-dialog.tsx'
import { FeedbackView } from './feedback/feedback-view.tsx'
import { LoginView } from './login-view.tsx'
import { NoticeView } from './notice/notice-view.tsx'
import { notify } from './notify.ts'
import { clearSession, hasSessionCookie } from './session.ts'

type Phase = 'loading' | 'login' | 'ready'
type ViewKey = 'notice' | 'feedback'

export function AdminShell() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [view, setView] = useState<ViewKey>('notice')
  const [noticeMode, setNoticeMode] = useState<NoticeMode>('dialog')
  const [noticeDirty, setNoticeDirty] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [noticeKey, setNoticeKey] = useState(0)
  const pendingView = useRef<ViewKey | null>(null)

  // The session lives in a client-owned cookie, so the phase is resolved without a
  // request; the deferred write keeps the first hydration render identical to the SSR one.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase(hasSessionCookie() ? 'ready' : 'login')
      const params = new URLSearchParams(window.location.search)
      if (params.get('view') === 'feedback') setView('feedback')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!noticeDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [noticeDirty])

  const handleUnauthorized = useCallback(() => {
    clearSession()
    setPhase('login')
  }, [])

  function applyView(next: ViewKey) {
    setView(next)
    const url = new URL(window.location.href)
    url.searchParams.set('view', next)
    window.history.replaceState(null, '', url.toString())
  }

  function requestSwitch(next: ViewKey) {
    if (next === view) return
    if (view === 'notice' && noticeDirty) {
      pendingView.current = next
      setConfirmLeave(true)
      return
    }
    applyView(next)
  }

  function confirmLeaveHandler() {
    const next = pendingView.current ?? 'feedback'
    pendingView.current = null
    setNoticeKey((key) => key + 1)
    setNoticeDirty(false)
    setConfirmLeave(false)
    applyView(next)
  }

  function handleLogout() {
    clearSession()
    setNoticeDirty(false)
    setPhase('login')
  }

  if (phase === 'loading') {
    return <div className="flex h-full items-center justify-center text-muted-foreground text-sm">正在加载…</div>
  }

  if (phase === 'login') {
    return (
      <LoginView
        onAuthenticated={() => {
          setPhase('ready')
          notify('登录成功')
        }}
      />
    )
  }

  return (
    <Tabs
      className="flex h-full min-h-0 flex-col gap-0 isolate"
      onValueChange={(value) => requestSwitch(value as ViewKey)}
      value={view}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b px-5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex min-w-0 flex-col">
            <strong className="truncate font-semibold text-sm">小江课表管理台</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {view === 'notice' && (
            <Tabs onValueChange={(value) => setNoticeMode(value as NoticeMode)} value={noticeMode}>
              <TabsList aria-label="公告模式">
                <TabsTab value="bar">横幅</TabsTab>
                <TabsTab value="dialog">弹窗</TabsTab>
              </TabsList>
            </Tabs>
          )}

          <TabsList aria-label="管理功能">
            <TabsTab value="notice">公告编辑</TabsTab>
            <TabsTab value="feedback">反馈管理</TabsTab>
          </TabsList>
        </div>

        <Button onClick={handleLogout} variant="secondary">
          <LogOutIcon />
          退出登录
        </Button>
      </header>

      {/*
        Base UI keeps the outgoing panel mounted until its exit transition settles. Panels are
        therefore overlaid instead of stacked in flow, and each one renders its view only while
        selected, so a panel on its way out can never take space or show stale content.
      */}
      <main className="min-h-0 flex-1 overflow-x-auto p-3 sm:p-4">
        <div className="relative h-full min-h-0">
          <TabsPanel className="absolute inset-0" value="notice">
            {view === 'notice' && (
              <NoticeView
                key={noticeKey}
                mode={noticeMode}
                onDirtyChange={setNoticeDirty}
                onModeChange={setNoticeMode}
                onUnauthorized={handleUnauthorized}
              />
            )}
          </TabsPanel>
          <TabsPanel className="absolute inset-0" value="feedback">
            {view === 'feedback' && <FeedbackView onUnauthorized={handleUnauthorized} />}
          </TabsPanel>
        </div>
      </main>

      <ConfirmDialog
        confirmLabel="确定离开"
        message="当前公告有未保存修改，确定离开吗？"
        onConfirm={confirmLeaveHandler}
        onOpenChange={(open) => {
          if (!open) setConfirmLeave(false)
        }}
        open={confirmLeave}
        title="未保存的修改"
      />
    </Tabs>
  )
}

import { toastManager } from '~/components/ui/toast.tsx'

export type NotifyType = 'success' | 'error' | 'info' | 'warning'

/** Single entry point for the toasts rendered by the `ToastProvider` in `app/app.tsx`. */
export function notify(message: string, type: NotifyType = 'success'): void {
  toastManager.add({ title: message, type })
}

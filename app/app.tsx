import { ToastProvider } from '~/components/ui/toast.tsx'
import { AdminShell } from './admin/shell.tsx'

export function App() {
  return (
    <ToastProvider>
      <AdminShell />
    </ToastProvider>
  )
}

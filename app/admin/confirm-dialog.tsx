import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog.tsx'
import { Button } from '~/components/ui/button.tsx'

/**
 * Confirmation used by the notice editor, the reply form and the unsaved-changes
 * guard. The confirm button stays open while `busy` so the caller can await the
 * request before closing.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  busy = false,
  danger = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  confirmLabel: string
  busy?: boolean
  danger?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose disabled={busy} render={<Button variant="outline" />}>
            取消
          </AlertDialogClose>
          <Button loading={busy} onClick={onConfirm} variant={danger ? 'destructive' : 'default'}>
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

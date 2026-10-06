import { useDatabase } from 'nitro/database'

export type NoticeRow = { dialog_json: string; updated_at: string; history_json?: string }

export const findNotice = async () =>
  useDatabase().prepare('SELECT dialog_json, updated_at, history_json FROM notices WHERE id = 1').get() as Promise<
    NoticeRow | undefined
  >

export const saveNoticeRow = async (dialog: string, updatedAt: string, history: string) => {
  await useDatabase()
    .prepare(
      'INSERT INTO notices (id, dialog_json, updated_at, history_json) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET dialog_json=excluded.dialog_json, updated_at=excluded.updated_at, history_json=excluded.history_json',
    )
    .bind(dialog, updatedAt, history)
    .run()
}

export const deleteNotice = async () => {
  await useDatabase().exec('DELETE FROM notices WHERE id = 1')
}

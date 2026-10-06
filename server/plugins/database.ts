import { definePlugin } from 'nitro'
import { runTask } from 'nitro/task'

export default definePlugin(async () => {
  await runTask('db:migrate')
})

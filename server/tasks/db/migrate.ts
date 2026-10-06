import { useDatabase } from 'nitro/database'
import { defineTask } from 'nitro/task'

const migrationModules = import.meta.glob<string>('../../../migrations/*.sql', {
  eager: true,
  import: 'default',
  query: '?raw',
})

const migrations = Object.entries(migrationModules)
  .map(([path, sql]) => ({
    name: path.split(/[\\/]/).pop() ?? path,
    sql,
  }))
  .sort((left, right) => left.name.localeCompare(right.name))

export default defineTask({
  meta: {
    name: 'db:migrate',
    description: 'Apply pending database migrations',
  },
  async run() {
    const db = useDatabase()

    await db.exec(`
      CREATE TABLE IF NOT EXISTS nitro_migrations (
        name TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      )
    `)

    const { rows = [] } = await db.sql`SELECT name FROM nitro_migrations`
    const applied = new Set(rows.map((row) => String(row.name)))
    const appliedMigrations: string[] = []

    for (const migration of migrations) {
      if (applied.has(migration.name)) continue

      await db.exec(migration.sql)
      await db.sql`
        INSERT INTO nitro_migrations (name, applied_at)
        VALUES (${migration.name}, ${new Date().toISOString()})
      `
      appliedMigrations.push(migration.name)
    }

    return {
      result: {
        applied: appliedMigrations,
        skipped: migrations.length - appliedMigrations.length,
        total: migrations.length,
      },
    }
  },
})

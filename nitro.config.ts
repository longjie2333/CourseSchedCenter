import { defineConfig } from 'nitro'

export default defineConfig({
  serverDir: './server',
  errorHandler: './server/error.ts',
  routeRules: {
    '**': { cors: true },
  },
  experimental: {
    database: true,
    tasks: true,
  },
  database: {
    default: {
      connector: 'sqlite',
      options: {
        path: '.data/main.sqlite',
      },
    },
  },
  runtimeConfig: {
    nitro: {
      envPrefix: 'KB_',
    },
    totpSecret: '',
    jwtSecret: '',
    wcmpAppid: '',
    wcmpSecret: '',
    wcmpTemplateId: '',
    feedbackHook: '',
  },
})

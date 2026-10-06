import type { NitroRuntimeConfig } from 'nitro/types'

declare module 'nitro/types' {
  interface NitroRuntimeConfig {
    totpSecret: string
    jwtSecret: string
    wcmpAppid: string
    wcmpSecret: string
    wcmpTemplateId: string
    feedbackHook: string
  }
}

declare module 'nitro/runtime-config' {
  function useRuntimeConfig(): NitroRuntimeConfig
}

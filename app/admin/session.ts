import { JWT_COOKIE } from '../admin-api.ts'

/**
 * `/api/auth/login` returns the signed JWT instead of setting a cookie, so the
 * browser owns the session cookie that `server/middleware/auth.ts` reads back.
 */
export function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((entry) => entry.startsWith(`${JWT_COOKIE}=`))
}

export function saveSession(token: string, expiresAt: string): void {
  const expires = new Date(expiresAt).getTime()
  const maxAge = Number.isFinite(expires) ? Math.max(0, Math.floor((expires - Date.now()) / 1000)) : 0
  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${JWT_COOKIE}=${token}; path=/; max-age=${maxAge}; samesite=lax${secure}`
}

export function clearSession(): void {
  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${JWT_COOKIE}=; path=/; max-age=0; samesite=lax${secure}`
}

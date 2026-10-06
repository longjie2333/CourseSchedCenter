import { TOTP } from 'otpauth'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { useRuntimeConfig } from 'nitro/runtime-config'

const { jwtSecret, totpSecret } = useRuntimeConfig()

export const JWT_COOKIE = 'admin_session'
export const JWT_TTL = 12 * 60 * 60

export type JwtPayload = JWTPayload & { v: number; exp: number }

export const signJwt = async () => {
  return new SignJWT({ v: 1 })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL}s`)
    .sign(new TextEncoder().encode(jwtSecret))
}

export const verifyJwt = async (value?: string) => {
  if (!value) return null

  try {
    const key = new TextEncoder().encode(jwtSecret)
    const { payload, protectedHeader } = await jwtVerify(value, key, { algorithms: ['HS256'] })
    return protectedHeader.typ === 'JWT' && payload.v === 1 ? (payload as JwtPayload) : null
  } catch {
    return null
  }
}

export const verifyTotp = (code: string) => {
  const totp = new TOTP({
    secret: totpSecret,
    digits: 6,
    period: 30,
    algorithm: 'SHA1',
  })
  const delta = totp.validate({ token: code, window: 1 })
  return delta !== null
}

const loginAttempts: number[] = []
export const allowLogin = () => {
  const cutoff = Date.now() - 60_000

  while (loginAttempts.length && loginAttempts[0] <= cutoff) {
    loginAttempts.shift()
  }

  if (loginAttempts.length >= 5) return false

  loginAttempts.push(Date.now())

  return true
}

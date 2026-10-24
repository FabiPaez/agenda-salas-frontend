import type { ApiErrorPayload } from '../types'

const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
let basicCredentials: string | null = null
let unauthorizedHandler: (() => void) | null = null

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: ApiErrorPayload) { super(message); this.name = 'ApiError' }
}

export function setCredentials(email: string, password: string) {
  const bytes = new TextEncoder().encode(`${email}:${password}`)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  basicCredentials = btoa(binary)
}
export function clearCredentials() { basicCredentials = null }
export function hasCredentials() { return basicCredentials !== null }
export function onUnauthorized(handler: (() => void) | null) { unauthorizedHandler = handler }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (basicCredentials) headers.set('Authorization', `Basic ${basicCredentials}`)
  let response: Response
  try { response = await fetch(`${baseUrl}${path}`, { ...init, headers }) }
  catch { throw new ApiError(0, 'No se pudo comunicar con el servidor. Revisá la conexión o la configuración de CORS.') }
  const text = response.status === 204 ? '' : await response.text()
  let body: unknown
  if (text) { try { body = JSON.parse(text) } catch { body = undefined } }
  if (!response.ok) {
    const payload = body && typeof body === 'object' ? body as ApiErrorPayload : undefined
    const message = payload?.message || ({ 400: 'Revisá los datos ingresados.', 401: 'Las credenciales son inválidas o vencieron.', 403: 'No tenés permisos para realizar esta operación.', 404: 'No se encontró el recurso solicitado.', 409: 'La operación entra en conflicto con datos existentes.' }[response.status] ?? `Error del servidor (${response.status}).`)
    if (response.status === 401) { clearCredentials(); unauthorizedHandler?.() }
    throw new ApiError(response.status, message, payload)
  }
  return (body ?? undefined) as T
}

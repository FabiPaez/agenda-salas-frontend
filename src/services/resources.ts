import type { RegistroInput, Reserva, ReservaInput, Sala, SalaInput, Usuario, UsuarioInput } from '../types'
import { api } from './api'

export const authService = { register: (input: RegistroInput) => api<Usuario>('/api/auth/registro', { method: 'POST', body: JSON.stringify(input) }) }
export const profileService = { me: () => api<Usuario>('/api/auth/me') }
export const salaService = {
  list: () => api<Sala[]>('/api/salas'),
  create: (input: SalaInput) => api<Sala>('/api/salas', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: SalaInput) => api<Sala>(`/api/salas/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => api<void>(`/api/salas/${id}`, { method: 'DELETE' }),
}
export const reservaService = {
  list: () => api<Reserva[]>('/api/reservas'),
  create: (input: ReservaInput) => api<Reserva>('/api/reservas', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: ReservaInput) => api<Reserva>(`/api/reservas/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => api<void>(`/api/reservas/${id}`, { method: 'DELETE' }),
}
export const usuarioService = {
  list: () => api<Usuario[]>('/api/usuarios'),
  create: (input: UsuarioInput) => api<Usuario>('/api/usuarios', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: UsuarioInput) => api<Usuario>(`/api/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  remove: (id: number) => api<void>(`/api/usuarios/${id}`, { method: 'DELETE' }),
}

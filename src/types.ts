export type Rol = 'CLIENTE' | 'PERSONAL' | 'ADMIN'
export type EstadoSala = 'DISPONIBLE' | 'MANTENIMIENTO' | 'INACTIVA'
export type EstadoReserva = 'CONFIRMADA' | 'CANCELADA'

export interface Sala { id: number; numero: number; capacidad: number; estado: EstadoSala }
export interface Usuario { id: number; nombre: string; apellido: string; email: string; tipo: Rol }
export interface Reserva { id: number; fecha: string; horaInicio: string; horaFin: string; usuarioId: number; salaId: number; estado: EstadoReserva }
export interface SalaInput { numero: number; capacidad: number; estado: EstadoSala }
export interface UsuarioInput { nombre: string; apellido: string; email: string; contrasena: string; tipo: Rol }
export interface RegistroInput { nombre: string; apellido: string; email: string; password: string }
export interface ReservaInput { fecha: string; horaInicio: string; horaFin: string; usuarioId: number; salaId: number; estado: EstadoReserva }
export interface ApiErrorPayload { status?: number; message?: string; date?: string }

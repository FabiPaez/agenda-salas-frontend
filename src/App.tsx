import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { clearCredentials, hasCredentials, onUnauthorized, setCredentials } from './services/api'
import { authService, profileService, reservaService, salaService, usuarioService } from './services/resources'
import type { EstadoSala, Reserva, ReservaInput, Rol, Sala, SalaInput, Usuario, UsuarioInput } from './types'

type Section = 'salas' | 'reservas' | 'admin'
const roomStates: EstadoSala[] = ['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVA']
const roles: Rol[] = ['CLIENTE', 'PERSONAL', 'ADMIN']
const errorText = (e: unknown) => e instanceof Error ? e.message : 'No se pudo completar la operación.'
const dateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('es-AR', { dateStyle: 'medium' })
const todayInArgentina = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })

export default function App() {
  const [signedIn, setSignedIn] = useState(hasCredentials())
  const [role, setRole] = useState<Rol | null>(null)
  const [section, setSection] = useState<Section>('salas')
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [notice, setNotice] = useState('')
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)
  const [salas, setSalas] = useState<Sala[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => { onUnauthorized(() => { setSignedIn(false); setRole(null); setNotice('La sesión venció. Ingresá nuevamente.') }) }, [])
  const load = useCallback(async () => {
    if (!signedIn) return
    setBusy(true); setAuthError('')
    try {
      const [rooms, bookings] = await Promise.all([salaService.list(), reservaService.list()])
      setSalas(rooms); setReservas(bookings)
      if (role === 'ADMIN') setUsuarios(await usuarioService.list())
    } catch (error) { setAuthError(errorText(error)) }
    finally { setBusy(false) }
  }, [signedIn, role, refresh])
  useEffect(() => { void load() }, [load])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError(''); setNotice(''); setBusy(true)
    const data = new FormData(event.currentTarget); const email = String(data.get('email')); const password = String(data.get('password'))
    setCredentials(email, password)
    try {
      const rooms = await salaService.list()
      const me = await profileService.me()
      setSalas(rooms); setCurrentUserId(me.id); setSignedIn(true); setRole(me.tipo)
      if (me.tipo === 'ADMIN') setUsuarios(await usuarioService.list())
      setNotice('Sesión iniciada. La autenticación se conserva solo en memoria y se pierde al recargar la página.')
    } catch (error) { clearCredentials(); setAuthError(errorText(error)) }
    finally { setBusy(false) }
  }
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setAuthError(''); setBusy(true)
    const data = new FormData(event.currentTarget)
    try { await authService.register({ nombre: String(data.get('nombre')), apellido: String(data.get('apellido')), email: String(data.get('email')), password: String(data.get('password')) }); setNotice('Cuenta CLIENTE creada. Ya podés iniciar sesión.'); setAuthMode('login') }
    catch (error) { setAuthError(errorText(error)) } finally { setBusy(false) }
  }
  function logout() { clearCredentials(); setSignedIn(false); setRole(null); setReservas([]); setUsuarios([]); setNotice('Sesión cerrada.') }
  const refreshData = () => setRefresh((v) => v + 1)
  const roleLabel = role === 'ADMIN' ? 'Administrador' : role === 'PERSONAL' ? 'Personal' : role === 'CLIENTE' ? 'Cliente' : ''

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#salas" onClick={() => setSection('salas')}><span className="brand-mark">A</span><span>Agenda de Salas<small>Gestión simple de espacios</small></span></a>
      <nav aria-label="Navegación principal">{signedIn && <><button className={section === 'salas' ? 'nav active' : 'nav'} onClick={() => setSection('salas')}>Salas</button><button className={section === 'reservas' ? 'nav active' : 'nav'} onClick={() => setSection('reservas')}>Reservas</button>{role === 'ADMIN' && <button className={section === 'admin' ? 'nav active' : 'nav'} onClick={() => setSection('admin')}>Administración</button>}</>}</nav>
      <div className="account">{signedIn ? <><span className="role-label">{roleLabel}</span><button className="button subtle" onClick={logout}>Salir</button></> : <button className="button subtle" onClick={() => { setAuthMode('login'); setNotice('') }}>Ingresar</button>}</div>
    </header>
    <main>
      {notice && <div className="notice" role="status">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}>×</button></div>}
      {!signedIn ? <section className="auth-layout"><div className="welcome"><p className="eyebrow">ESPACIOS QUE SE ORGANIZAN</p><h1>Encontrá tu próxima sala.</h1><p>Consultá espacios y organizá reservas en un solo lugar.</p><div className="welcome-art" aria-hidden="true"><div className="art-card"><span>HOY</span><b>Una sala lista<br/>para tus ideas</b><i>◷ &nbsp; Elegí día y horario</i></div><div className="art-orbit"/></div></div><section className="panel auth-panel"><div className="auth-tabs"><button className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setAuthError('') }}>Ingresar</button><button className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setAuthError('') }}>Crear cuenta</button></div><h2>{authMode === 'login' ? 'Qué bueno verte' : 'Sumate a Agenda'}</h2><p className="muted">{authMode === 'login' ? 'Ingresá con tu correo y contraseña.' : 'Tu cuenta se crea con rol de cliente.'}</p>
        <form onSubmit={authMode === 'login' ? login : register} className="form-stack">{authMode === 'register' && <><Field label="Nombre" name="nombre" required maxLength={80}/><Field label="Apellido" name="apellido" required maxLength={80}/></>}<Field label="Correo electrónico" name="email" type="email" required maxLength={150}/><Field label="Contraseña" name="password" type="password" required minLength={6} maxLength={50} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}/>{authError && <p className="error" role="alert">{authError}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Conectando…' : authMode === 'login' ? 'Ingresar' : 'Crear cuenta'}</button></form><p className="fineprint">Las credenciales se mantienen en memoria y se envían solo al servidor configurado.</p></section></section> : <>
        {authError && <div className="error-banner" role="alert">{authError}<button onClick={() => setAuthError('')}>Cerrar</button></div>}
        {section === 'salas' && <Rooms salas={salas} busy={busy} admin={role === 'ADMIN'} onReserve={() => setSection('reservas')} onChange={refreshData} />}
        {section === 'reservas' && <Bookings reservas={reservas} salas={salas} usuarios={usuarios} currentUserId={currentUserId} admin={role === 'ADMIN'} busy={busy} onChange={refreshData} />}
        {section === 'admin' && role === 'ADMIN' && <Administration usuarios={usuarios} salas={salas} onChange={refreshData} />}
      </>}
    </main>
    <footer><span>Agenda de Salas</span><span>Conectada al servicio de reservas</span></footer>
  </div>
}

function Field({ label, name, type = 'text', required, maxLength, minLength, autoComplete, defaultValue, min }: { label: string; name: string; type?: string; required?: boolean; maxLength?: number; minLength?: number; autoComplete?: string; defaultValue?: string | number; min?: string | number }) { return <label className="field">{label}<input name={name} type={type} required={required} maxLength={maxLength} minLength={minLength} autoComplete={autoComplete} defaultValue={defaultValue} min={min}/></label> }

function Rooms({ salas, busy, admin, onReserve, onChange }: { salas: Sala[]; busy: boolean; admin: boolean; onReserve: () => void; onChange: () => void }) {
  const [editing, setEditing] = useState<Sala | null | false>(false)
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const d = new FormData(event.currentTarget); const input: SalaInput = { numero: Number(d.get('numero')), capacidad: Number(d.get('capacidad')), estado: d.get('estado') as EstadoSala }; try { if (editing) await salaService.update(editing.id, input); else await salaService.create(input); setEditing(false); onChange() } catch (e) { alert(errorText(e)) } }
  async function remove(room: Sala) { if (!confirm(`¿Eliminar la sala ${room.numero}?`)) return; try { await salaService.remove(room.id); onChange() } catch (e) { alert(errorText(e)) } }
  return <><PageHeading eyebrow="ESPACIOS" title="Salas para cada plan" subtitle="Consultá capacidad y estado antes de elegir tu espacio." action={admin && <button className="button primary" onClick={() => setEditing(null)}>＋ Nueva sala</button>}/>
    {editing !== false && <div className="dialog-backdrop"><form className="panel dialog form-stack" onSubmit={save}><div className="dialog-head"><h2>{editing ? 'Editar sala' : 'Nueva sala'}</h2><button type="button" className="icon-button" onClick={() => setEditing(false)}>×</button></div><Field label="Número" name="numero" type="number" required min={1} defaultValue={editing?.numero}/><Field label="Capacidad" name="capacidad" type="number" required min={1} defaultValue={editing?.capacidad}/><label className="field">Estado<select name="estado" defaultValue={editing ? editing.estado : 'DISPONIBLE'}>{roomStates.map(s => <option key={s}>{s}</option>)}</select></label><button className="button primary">Guardar sala</button></form></div>}
    {busy ? <p className="loading" role="status">Cargando salas…</p> : salas.length === 0 ? <Empty title="Todavía no hay salas" body="Cuando haya salas disponibles, las vas a encontrar acá."/> : <div className="room-grid">{salas.map(s => <article className="room-card" key={s.id}><div className="room-visual"><span className="room-icon">▦</span><span className={`badge ${s.estado.toLowerCase()}`}>{s.estado === 'DISPONIBLE' ? 'Disponible' : s.estado === 'MANTENIMIENTO' ? 'Mantenimiento' : 'Inactiva'}</span></div><div className="room-details"><p className="eyebrow">SALA {String(s.numero).padStart(2, '0')}</p><h2>Sala {s.numero}</h2><p className="muted">Hasta <strong>{s.capacidad}</strong> personas</p><div className="room-actions">{s.estado === 'DISPONIBLE' ? <button className="button primary" onClick={onReserve}>Reservar sala <span aria-hidden="true">→</span></button> : <button className="button disabled" disabled>{s.estado === 'INACTIVA' ? 'No disponible' : 'En mantenimiento'}</button>}{admin && <div><button className="text-button" onClick={() => setEditing(s)}>Editar</button><button className="text-button danger-text" onClick={() => void remove(s)}>Eliminar</button></div>}</div></div></article>)}</div>}</>
}

function Bookings({ reservas, salas, usuarios, currentUserId, admin, busy, onChange }: { reservas: Reserva[]; salas: Sala[]; usuarios: Usuario[]; currentUserId: number | null; admin: boolean; busy: boolean; onChange: () => void }) {
  const [editing, setEditing] = useState<Reserva | null | false>(false)
  const [error, setError] = useState('')
  const userMap = useMemo(() => new Map(usuarios.map(u => [u.id, `${u.nombre} ${u.apellido}`])), [usuarios])
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const d = new FormData(event.currentTarget); const input: ReservaInput = { fecha: String(d.get('fecha')), horaInicio: `${d.get('horaInicio')}:00`, horaFin: `${d.get('horaFin')}:00`, usuarioId: editing ? editing.usuarioId : admin ? Number(d.get('usuarioId')) : Number(currentUserId), salaId: Number(d.get('salaId')), estado: editing && editing.estado === 'CANCELADA' ? 'CANCELADA' : 'CONFIRMADA' }; if (input.horaInicio >= input.horaFin) { setError('La hora de inicio debe ser anterior a la hora de fin.'); return } try { if (editing) await reservaService.update(editing.id, input); else await reservaService.create(input); setEditing(false); onChange() } catch (e) { setError(errorText(e)) } }
  async function cancel(item: Reserva) { if (!confirm('¿Cancelar esta reserva?')) return; try { await reservaService.update(item.id, { fecha: item.fecha, horaInicio: item.horaInicio, horaFin: item.horaFin, usuarioId: item.usuarioId, salaId: item.salaId, estado: 'CANCELADA' }); onChange() } catch (e) { setError(errorText(e)) } }
  const available = salas.filter(s => s.estado === 'DISPONIBLE')
  return <><PageHeading eyebrow="AGENDA" title="Reservas" subtitle="Consultá horarios y administrá las reservas registradas." action={<button className="button primary" onClick={() => setEditing(null)}>＋ Nueva reserva</button>}/>
    {editing !== false && <form className="panel booking-form" onSubmit={save}><h2>{editing ? 'Editar reserva' : 'Crear una reserva'}</h2><div className="form-grid"><label className="field">Sala<select name="salaId" required defaultValue={editing?.salaId ?? available[0]?.id}>{salas.map(s => <option value={s.id} key={s.id} disabled={s.estado !== 'DISPONIBLE'}>Sala {s.numero} · {s.capacidad} personas</option>)}</select></label><Field label="Fecha" name="fecha" type="date" required defaultValue={editing?.fecha ?? undefined} min={todayInArgentina()}/><Field label="Hora de inicio" name="horaInicio" type="time" required defaultValue={editing?.horaInicio.slice(0,5) ?? undefined}/><Field label="Hora de fin" name="horaFin" type="time" required defaultValue={editing?.horaFin.slice(0,5) ?? undefined}/>{admin && <label className="field">Usuario<select name="usuarioId" required defaultValue={editing?.usuarioId ?? usuarios[0]?.id}>{usuarios.map(u => <option value={u.id} key={u.id}>{u.nombre} {u.apellido} · {u.email}</option>)}</select></label>}</div>{error && <p className="error" role="alert">{error}</p>}<button className="button primary" disabled={!available.length || (!admin && !currentUserId)}>{editing ? 'Guardar cambios' : 'Confirmar reserva'}</button><button type="button" className="text-button" onClick={() => setEditing(false)}>Cerrar</button></form>}
    {busy ? <p className="loading">Cargando reservas…</p> : reservas.length === 0 ? <Empty title="Sin reservas por ahora" body="Las reservas registradas aparecerán en esta lista."/> : <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Sala</th><th>Fecha</th><th>Horario</th><th>Usuario</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>{reservas.map(r => <tr key={r.id}><td>Sala {salas.find(s => s.id === r.salaId)?.numero ?? `#${r.salaId}`}</td><td>{dateLabel(r.fecha)}</td><td>{r.horaInicio.slice(0,5)}–{r.horaFin.slice(0,5)}</td><td>{userMap.get(r.usuarioId) ?? `#${r.usuarioId}`}</td><td><span className={`badge ${r.estado.toLowerCase()}`}>{r.estado === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada'}</span></td><td>{r.estado === 'CONFIRMADA' && <><button className="text-button" onClick={() => setEditing(r)}>Editar</button><button className="text-button danger-text" onClick={() => void cancel(r)}>Cancelar</button></>}</td></tr>)}</tbody></table></div></div>}
  </>
}

function Administration({ usuarios, salas, onChange }: { usuarios: Usuario[]; salas: Sala[]; onChange: () => void }) {
  const [tab, setTab] = useState<'usuarios'|'salas'>('usuarios')
  const [editing, setEditing] = useState<Usuario | null | false>(false)
  const [error, setError] = useState('')
  async function remove(id: number, label: string, kind: 'usuarios'|'salas') { if (!confirm(`¿Eliminar ${label}?`)) return; try { if (kind === 'usuarios') await usuarioService.remove(id); else await salaService.remove(id); onChange() } catch (e) { alert(errorText(e)) } }
  async function saveUser(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const d = new FormData(event.currentTarget); const input: UsuarioInput = { nombre: String(d.get('nombre')), apellido: String(d.get('apellido')), email: String(d.get('email')), contrasena: String(d.get('contrasena')), tipo: d.get('tipo') as Rol }; try { if (editing) await usuarioService.update(editing.id, input); else await usuarioService.create(input); setEditing(false); onChange() } catch (e) { setError(errorText(e)) } }
  return <><PageHeading eyebrow="ADMINISTRACIÓN" title="Gestión" subtitle="Administrá las salas y las cuentas del sistema."/><div className="subnav"><button className={tab === 'usuarios' ? 'selected' : ''} onClick={() => setTab('usuarios')}>Usuarios</button><button className={tab === 'salas' ? 'selected' : ''} onClick={() => setTab('salas')}>Salas</button></div>{tab === 'usuarios' ? <><div className="page-heading"><p className="muted">{usuarios.length} cuentas registradas</p><button className="button primary" onClick={() => { setEditing(null); setError('') }}>＋ Nuevo usuario</button></div>{editing !== false && <form className="panel booking-form" onSubmit={saveUser}><h2>{editing ? 'Editar usuario' : 'Crear usuario'}</h2><div className="form-grid"><Field label="Nombre" name="nombre" required maxLength={80} defaultValue={editing?.nombre}/><Field label="Apellido" name="apellido" required maxLength={80} defaultValue={editing?.apellido}/><Field label="Correo electrónico" name="email" type="email" required maxLength={80} defaultValue={editing?.email}/><Field label="Contraseña" name="contrasena" type="password" required minLength={8} maxLength={50} autoComplete="new-password"/><label className="field">Rol<select name="tipo" defaultValue={editing?.tipo ?? 'CLIENTE'}>{roles.map(r => <option key={r}>{r}</option>)}</select></label></div>{error && <p className="error" role="alert">{error}</p>}<button className="button primary">Guardar usuario</button><button type="button" className="text-button" onClick={() => setEditing(false)}>Cerrar</button><p className="fineprint">El endpoint PUT también requiere una contraseña nueva (mínimo 8 caracteres).</p></form>}<div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th/></tr></thead><tbody>{usuarios.map(u => <tr key={u.id}><td>{u.nombre} {u.apellido}</td><td>{u.email}</td><td>{u.tipo}</td><td><button className="text-button" onClick={() => { setEditing(u); setError('') }}>Editar</button><button className="text-button danger-text" onClick={() => void remove(u.id, `${u.nombre} ${u.apellido}`, 'usuarios')}>Eliminar</button></td></tr>)}</tbody></table></div></div></> : <div className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Número</th><th>Capacidad</th><th>Estado</th><th/></tr></thead><tbody>{salas.map(s => <tr key={s.id}><td>Sala {s.numero}</td><td>{s.capacidad}</td><td>{s.estado}</td><td><button className="text-button danger-text" onClick={() => void remove(s.id, `la sala ${s.numero}`, 'salas')}>Eliminar</button></td></tr>)}</tbody></table></div><p className="fineprint">Para crear o editar salas, usá las acciones de la sección Salas.</p></div>}</>
}

function PageHeading({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{subtitle}</p></div>{action}</div> }
function Empty({ title, body }: { title: string; body: string }) { return <div className="empty-state"><span aria-hidden="true">◌</span><h2>{title}</h2><p>{body}</p></div> }

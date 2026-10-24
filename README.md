# Agenda de Salas · frontend

Frontend React + TypeScript + Vite para la API de Agenda de Salas.

## Requisitos

- Node.js 20.19+ o 22.12+.
- API local en `http://localhost:8080` o URL configurada en `VITE_API_URL`.

## Desarrollo local

```powershell
cd frontend
Copy-Item .env.example .env.local
npm install
npm run dev
```

`VITE_API_URL` es pública y se incorpora al bundle. Para producción, configurar `VITE_API_URL=https://agenda-salas.onrender.com` en el proveedor del frontend. No guardar claves ni secretos en variables `VITE_*`.

## Autenticación

El acceso utiliza HTTP Basic del backend, sin JWT. El frontend guarda la credencial solo en memoria, la codifica con UTF-8 para cada solicitud y la elimina al cerrar sesión o recibir un `401`. La sesión se pierde al recargar la página. Usar HTTPS en producción.

El frontend consulta `GET /api/auth/me` para obtener el rol e ID del usuario autenticado. Ese endpoint debe estar desplegado en el backend antes de usar la integración. Es de solo lectura y devuelve el DTO público (`id`, nombre, apellido, correo y tipo), nunca la contraseña.

## CORS del backend

El backend permite por defecto `http://localhost:5173`. En el servicio desplegado, configurar `FRONTEND_ORIGINS` con el origen exacto del hosting, por ejemplo `https://agenda-salas-ui.example.com`. Para más de uno, separar los orígenes por comas. No usar `*`.

## Build

```powershell
npm run build
```

Para servir el resultado de producción localmente: `npm run preview`.

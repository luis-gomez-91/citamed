# Arquitectura — Plataforma médica

## 1. Resumen

Aplicación web con frontend SvelteKit y API NestJS modular. PostgreSQL es la fuente de verdad. El acceso a datos es Prisma.

El navegador habla con SvelteKit. Las operaciones de negocio pasan por la API. La generación de PDF y el envío de correo salen de la petición HTTP y entran en una cola BullMQ sobre Redis. Los archivos clínicos viven en un bucket privado. El QR y los enlaces apuntan a una ruta de verificación que no publica el archivo de forma permanente.

```text
Navegador
   ↓
SvelteKit (SSR)
   ↓
API NestJS (módulos por capacidad)
   ↓
Prisma → PostgreSQL
   ↓
BullMQ → Redis → trabajadores (PDF, correo)
   ↓
Bucket privado (S3, R2 o Supabase Storage) y proveedor de correo
```

## 2. Objetivos técnicos

- Separar citas, recetas, documentos, identidad y distribución en módulos NestJS.
- No bloquear la API en la generación de PDF ni en el correo.
- Entregar documentos solo con URL temporal o token de acceso.
- Mantener la UI usable en móvil y escritorio con Tailwind y shadcn-svelte, con SSR de SvelteKit.

## 3. Principios y restricciones arquitectónicas

### Principios

- Un módulo por capacidad del SRS: identidad, citas, prescripciones, documentos, distribución.
- La API responde al usuario cuando el caso de uso queda persistido; PDF y correo son trabajos posteriores.
- El bucket no es público. La verificación muestra solo lo que la decisión de privacidad autorice.

### Restricciones

- Backend NestJS con TypeScript.
- PostgreSQL.
- ORM: Prisma.
- Frontend SvelteKit, Tailwind CSS y shadcn-svelte (bits-ui).
- JWT con `@nestjs/jwt` y rotación de refresh tokens.
- Identidad adicional: OTP y Google OAuth.
- Colas: BullMQ y Redis.
- PDF: pdfmake.
- QR: librería `qrcode`.
- Correo: Resend. Plantillas con React Email.
- Archivos: Cloudflare R2.
- HTTPS en tránsito. Cifrado en reposo en PostgreSQL y en el almacenamiento.

## 4. Componentes del sistema

### Backend

API HTTP, módulos de dominio, emisión de JWT, encolado de trabajos y trabajadores que generan PDF y envían correo.

### Frontend

Rutas de paciente, médico y administración, formularios de cita y receta, y la página pública de verificación de documento. El servidor de SvelteKit puede proxyar la API; el detalle de BFF queda abierto.

### Base de datos

PostgreSQL con el esquema de usuarios, perfiles, disponibilidad, citas, recetas, ítems y documentos. Prisma Migrate cuando se confirme el ORM.

### Servicios externos

Proveedor de correo, bucket de objetos y, si la firma no es solo una imagen subida, un mecanismo de firma aún no elegido.

### Infraestructura

- Redis para BullMQ.
- Bucket privado.
- Secretos de JWT, correo y storage fuera del repositorio.
- Despliegue concreto no definido en el SRS.

## 5. Flujo general del sistema

### Reserva

```text
Paciente → SvelteKit → API citas → valida slot en PostgreSQL → persiste cita
        → encola correo de confirmación → trabajador → proveedor de correo
```

### Receta

```text
Médico → SvelteKit → API prescripciones → persiste receta e ítems y token de verificación
       → encola PDF → trabajador genera PDF con QR (qrcode) → sube al bucket
       → encola correo con PDF o enlace
```

### Verificación

```text
Tercero → URL del QR → SvelteKit / API distribución → comprueba token, expiración y PIN
        → responde solo los datos públicos acordados
```

### Descarga

```text
Titular o enlace válido → API → URL pre-firmada de corta vida → bucket
```

## 6. Estructura del proyecto

Monorepo con dos aplicaciones.

```text
citamed/
├── apps/
│   ├── api/                 # NestJS
│   └── web/                 # SvelteKit
├── packages/
│   └── contracts/           # tipos compartidos, si hacen falta
└── docs/
```

Dentro de `apps/api/src`: `identity`, `appointments`, `prescriptions`, `documents`, `distribution`, `queue`.

Dentro de `apps/web/src`: rutas por rol y la ruta pública de verificación.

## 7. Módulos

### Identidad

**Responsabilidad:** login del personal por OTP de correo o Google, refresh con rotación y RBAC. El paciente no tiene credenciales.

**Dependencias:** PostgreSQL, correo (recuperación), `@nestjs/jwt`.

**Componentes principales:** servicio de autenticación, guard de roles, emisión de OTP.

### Citas

**Responsabilidad:** bloques, ausencias, slots, reserva, reprogramación, cancelación y recordatorios.

**Dependencias:** identidad, cola de correo.

**Componentes principales:** cálculo de disponibilidad, máquina de estados de la cita, job de recordatorio.

### Prescripciones

**Responsabilidad:** receta, ítems, firma y solicitud de PDF.

**Dependencias:** citas, distribución, cola de PDF, bucket.

**Componentes principales:** agregado de receta, plantilla PDF, inclusión del QR.

### Documentos

**Responsabilidad:** carga de PDF e imágenes y acceso restringido.

**Dependencias:** identidad, bucket, distribución.

**Componentes principales:** validación de tipo, subida, emisión de URL temporal.

### Distribución

**Responsabilidad:** token de acceso, expiración, PIN opcional, URL de verificación y QR.

**Dependencias:** prescripciones, documentos, correo.

**Componentes principales:** emisor de tokens, vista de verificación, plantillas de correo.

### Cola

**Responsabilidad:** trabajos de PDF, correo y recordatorios, con reintento.

**Dependencias:** Redis, BullMQ.

**Componentes principales:** productores en los módulos de negocio, consumidores aislados.

## 8. Dominio

### Entidades

User, Profile, DoctorAvailability, Appointment, Prescription, PrescriptionItem, MedicalDocument.

Extensiones probables, sujetas a las decisiones pendientes: Specialty, DoctorTimeOff, RefreshToken, PasswordResetToken, campos de modalidad, firma, `expires_at` y secreto de PIN en el acceso al documento.

### Relaciones

Ver `docs/spec.md`. La receta cuelga de la cita. El documento cuelga de paciente y médico. El token de verificación no sustituye la clave primaria.

### Reglas importantes

- Un slot no se entrega dos veces.
- El archivo clínico no tiene URL pública estable.
- El refresh token se rota en cada renovación.
- El PDF se genera fuera del hilo de la petición.

### Servicios de dominio

- Resolutor de huecos horarios.
- Transiciones de cita, cuando se cierren.
- Emisión y comprobación del token de documento.

### Value Objects

Intervalo horario, estado de cita, token de acceso. Solo si simplifican las reglas; no son obligatorios en la primera implementación.

## 9. API y contratos

Contratos orientativos. Los nombres pueden ajustarse al implementar.

### Sesión

**Método:** POST  
**Ruta:** `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`  
**Propósito:** identidad y recuperación.  
**Autorización:** públicas, con límite de intentos por definir.  
**Errores:** 401 credenciales, 400 token de reset inválido.

### Citas

**Método:** GET disponibilidad; POST reserva; PATCH reprogramar o cancelar.  
**Ruta:** `/appointments`, `/doctors/:id/availability`  
**Propósito:** RF-CITA.  
**Autorización:** la reserva pública usa el enlace del médico. El médico solo opera su consultorio.  
**Errores:** 409 slot ocupado, 403 rol.

### Recetas

**Método:** POST  
**Ruta:** `/appointments/:id/prescriptions`  
**Propósito:** emitir receta y encolar PDF.  
**Autorización:** médico de la cita, salvo que la decisión de historial amplíe el acceso.  
**Salida:** receta persistida; el PDF puede llegar después.  
**Errores:** 404 cita, 422 ítem inválido.

### Documentos

**Método:** POST carga; GET descarga.  
**Ruta:** `/documents`, `/documents/:id/download`  
**Propósito:** adjunto y URL temporal.  
**Autorización:** médico que carga; paciente dueño; enlace con token.  
**Errores:** 415 tipo no permitido, 403 token.

### Verificación

**Método:** GET  
**Ruta:** `/v/:id?token=`  
**Propósito:** validar autenticidad según la política pública.  
**Autorización:** token válido y, si aplica, PIN.  
**Errores:** 404 o 410 si el token no vale, sin filtrar si el documento existe.

## 10. Persistencia

### Modelos principales

Los siete del SRS, más tablas de refresh y de reset porque el mecanismo de sesión y la recuperación no pueden persistirse solo con `users`.

### Relaciones

Claves foráneas de perfil a usuario, disponibilidad y citas a médico y paciente, ítems a receta, documentos a paciente y médico.

### Índices y restricciones

- `users.email` único.
- Unicidad de cita por médico y fecha-hora mientras el estado no sea `CANCELLED`, para cerrar la carrera de dos reservas.
- Índice del token de verificación.

### Estrategia de persistencia

Prisma como propuesta. Migraciones versionadas. La reserva del slot y la escritura de la cita en la misma transacción.

## 11. Autenticación y autorización

- Contraseña con hash (argon2 o bcrypt; algoritmo no fijado en el SRS).
- Access token JWT de vida corta y refresh opaco almacenado, rotado en cada uso.
- Rol con sesión: `DOCTOR`. Cada registro cuelga de ese médico. No hay rol de clínica.
- Guards por rol y comprobación de propiedad (la cita o el documento pertenecen al usuario).
- Rutas públicas: login, registro, reset y verificación con token.

## 12. Manejo de errores

- Validación de entrada en el borde HTTP (400).
- Reglas de negocio (slot, estado, PIN) con códigos 409 o 422.
- 401 y 403 separados.
- Fallos de cola, bucket o correo: log y reintento del job; la API no devuelve 500 si la entidad ya se guardó y el trabajo quedó encolado.
- Error no controlado: 500 sin detalle interno.

## 13. Validación y testing

### Unit tests

Slots, transiciones de cita, rotación de refresh y reglas del token de documento.

### Integration tests

API con PostgreSQL: reserva concurrente, RBAC y persistencia de receta.

### End-to-end tests

Reserva desde la UI, emisión de receta y apertura del enlace de verificación. Dependen de tener la app levantada.

### Validaciones adicionales

Typecheck, lint y build de API y web.

## 14. Integraciones

### Correo (Resend o SendGrid)

**Propósito:** confirmación, recordatorio, recuperación y entrega de receta.  
**Comunicación:** SDK del proveedor, desde el trabajador.  
**Datos:** destinatario, plantilla y enlace o PDF.  
**Errores:** reintento con tope; no revertir la cita o la receta.

### Bucket (S3, R2 o Supabase)

**Propósito:** PDF de recetas y adjuntos.  
**Comunicación:** SDK, URLs pre-firmadas.  
**Datos:** objeto privado y metadatos de clave en la base.  
**Errores:** el registro del documento no queda con URL pública de respaldo.

### QR

**Propósito:** imagen del código dentro del PDF.  
**Comunicación:** librería local `qrcode`.  
**Datos:** URL de verificación.  
**Errores:** si el QR falla, el job de PDF falla y se reintenta.

## 15. Configuración e infraestructura

### Variables de entorno

`DATABASE_URL`, secreto JWT, TTL de access y refresh, `REDIS_URL`, credenciales del bucket, API key de correo, URL pública de la app para armar enlaces y QR.

### Almacenamiento

Bucket privado. La columna `pdf_url` / `file_url` guarda la clave del objeto, no una URL permanente.

### Cache

No requerido por el SRS. Redis se usa para la cola.

### Colas / procesamiento asíncrono

Colas separadas o nombres distintos para `mail`, `pdf` y `reminders`. Reintentos con backoff. El recordatorio lo dispara un job programado.

### Deployment

Sin plataforma fijada. Hacen falta proceso API, proceso worker, PostgreSQL y Redis.

## 16. Seguridad

- TLS.
- OTP de un solo uso y vida corta. No hay contraseña ni PIN de enlace.
- Refresh y tokens de reset de un solo uso.
- Presigned URLs de vida corta.
- La página de verificación no lista otros documentos ni datos de más.
- Secretos solo en el entorno.
- Límite de intentos en login y en PIN, umbral por definir.
- Registro de acceso a documentos clínicos: recomendable para datos de salud; el SRS no lo exige de forma explícita. Queda asociado a la jurisdicción pendiente.

## 17. Observabilidad

### Logging

Cada job registra id de entidad y resultado, sin cuerpo clínico ni tokens.

### Métricas

Profundidad de cola, fallos de correo y de PDF, latencia de reserva.

### Tracing

No exigido. Un id de petición basta en la primera versión.

### Health checks

`GET /health` de API y conectividad de Postgres y Redis.

## 18. Decisiones técnicas

### DA-001 — Prisma

**Decisión:** Prisma.  
**Razón:** elegido para este proyecto; encaja con el TypeScript del SRS.  
**Alternativas:** TypeORM.  
**Trade-off:** el modelo vive en `schema.prisma`, no en decoradores.

### DA-002 — PDF y correo fuera de la petición

**Decisión:** BullMQ.  
**Razón:** el SRS lo pide para no bloquear la API.  
**Alternativas:** generar el PDF en la petición.  
**Trade-off:** hace falta Redis y un worker.

### DA-003 — Clave de objeto en lugar de URL pública

**Decisión:** persistir la clave; entregar presigned URL al leer.  
**Razón:** el SRS prohíbe exposición pública permanente.  
**Alternativas:** URL del bucket guardada en `pdf_url`.  
**Trade-off:** el campo del esquema simplificado cambia de significado.

### DA-004 — Monorepo

**Decisión:** `apps/api` y `apps/web` en este repositorio.  
**Razón:** un solo producto con dos runtimes.  
**Alternativas:** dos repositorios.  
**Trade-off:** el tooling del monorepo pesa más al inicio.

### DA-005 — pdfmake, Resend y R2

**Decisión:** PDF con pdfmake, correo con Resend y React Email, objetos en Cloudflare R2.  
**Razón:** elección de proyecto. pdfmake evita un navegador headless en el worker.  
**Alternativas:** `@react-pdf/renderer`, Puppeteer, SendGrid, S3, Supabase Storage.  
**Trade-off:** las plantillas de correo usan React en un worker NestJS.

## 19. Riesgos y consideraciones

- Datos de salud: la jurisdicción pendiente cambia retención, auditoría y encargados.
- Dos reservas a la vez exigen restricción en base de datos, no solo una comprobación en memoria.
- Elegir Puppeteer aumenta el tamaño del worker frente a una librería de PDF declarativa.
- Un QR demasiado informativo filtra datos clínicos.
- Firma “digital” puede implicar requisitos legales que una imagen no cubre.

## 20. Decisiones pendientes

- TTL de access y refresh tokens.
- Plataforma de despliegue.
- Nada de clínica. El médico se registra solo.

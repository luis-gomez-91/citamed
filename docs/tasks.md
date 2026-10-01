## Objetivo

Implementar la plataforma médica descrita en `docs/spec.md` con la arquitectura de `docs/architecture.md`.

El producto es un consultorio por médico, sin clínica. Quedan la duración de los tokens y el despliegue.

---

# Convenciones

Identificadores `TASK-xxx`. Cada tarea cita requisito y criterio de aceptación. El estado inicial es Pendiente.

---

# Fases

## Fase 0 — Cierres que bloquean el diseño

### TASK-001 — Cerrar decisiones de producto y de proveedores

**Objetivo**

Dejar por escrito las decisiones de `docs/spec.md` y `docs/architecture.md` que cambian el esquema o las integraciones.

**Referencia**

- Requisito: RF-CITA, RF-RX, RF-DIST
- Decisión arquitectónica: DA-001 y decisiones pendientes de arquitectura

**Dependencias**

- Ninguna

**Alcance**

- El médico se registra solo. No hay administrador inicial.

**Fuera de alcance**

- Código de aplicación.

**Archivos / componentes afectados**

- `docs/spec.md`
- `docs/architecture.md`

**Resultado esperado**

Decisiones marcadas como cerradas, con la alternativa elegida.

**Validación**

- Ninguna tarea de esquema contradice una decisión aún abierta.

**Estado**

- Pendiente

---

## Fase 1 — Esqueleto

### TASK-002 — Crear el esqueleto del monorepo

**Objetivo**

Tener API NestJS y app SvelteKit compilando, con Tailwind y la base de shadcn-svelte.

**Referencia**

- Decisión arquitectónica: DA-004

**Dependencias**

- TASK-001 en lo que afecta a carpetas si se rechaza el monorepo

**Alcance**

- `apps/api` y `apps/web` según la estructura acordada.
- Typecheck y lint mínimos.
- Health check de la API.

**Fuera de alcance**

- Módulos de negocio.

**Archivos / componentes afectados**

- `apps/api`
- `apps/web`

**Resultado esperado**

API en marcha con `GET /health` y frontend que renderiza una página base.

**Validación**

- Build de ambos proyectos.
- `GET /health` responde.

**Estado**

- Completada

---

### TASK-003 — Modelo de datos inicial

**Objetivo**

Persistir usuarios, perfiles, disponibilidad, citas, recetas, ítems y documentos, más refresh tokens y tokens de recuperación.

**Referencia**

- Requisito: esquema de la sección 6 del SRS
- Decisión arquitectónica: DA-001, DA-003

**Dependencias**

- TASK-001
- TASK-002

**Alcance**

- Schema y primera migración.
- Unicidad de email.
- Restricción para impedir dos citas activas del mismo médico en el mismo horario.
- Clave de objeto en lugar de URL pública permanente.
- Campos que TASK-001 haya añadido (especialidad, modalidad, ausencia, expiración, PIN).

**Fuera de alcance**

- Endpoints.

**Archivos / componentes afectados**

- Schema del ORM en `apps/api`

**Resultado esperado**

Base migrada y cliente del ORM generado.

**Validación**

- Migración aplica en PostgreSQL vacío.
- Inserción duplicada de email y de slot activo falla.

**Estado**

- Pendiente

---

### TASK-004 — Redis, BullMQ y trabajador vacío

**Objetivo**

Dejar la cola operativa para correo, PDF y recordatorios.

**Referencia**

- Decisión arquitectónica: DA-002

**Dependencias**

- TASK-002

**Alcance**

- Conexión a Redis.
- Colas `mail`, `pdf` y `reminders`.
- Worker que registra el job y reintenta.

**Fuera de alcance**

- Plantillas reales de correo y PDF.

**Archivos / componentes afectados**

- `apps/api` módulo de cola

**Resultado esperado**

Un job de prueba se consume y un fallo se reintenta.

**Validación**

- Test de integración con Redis: enqueue y ack.

**Estado**

- Pendiente

---

## Fase 2 — Identidad

### TASK-005 — Acceso del personal

**Objetivo**

Abrir la cuenta del médico con OTP por correo o Google, y refresh rotativo. El paciente no tiene cuenta. Los datos quedan aislados por médico.

**Referencia**

- Requisito: RF-AUTH-1, RF-AUTH-2, RF-AUTH-3
- Criterio de aceptación: AC-AUTH-1, AC-AUTH-2, AC-AUTH-3

**Dependencias**

- TASK-003

**Alcance**

- OTP de un solo uso enviado con Resend.
- Login con Google limitado a cuentas de personal.
- Refresh con invalidación del token anterior.
- Guard por rol.

**Fuera de alcance**

- Alta masiva de pacientes.
- Pantallas finales de producto.

**Archivos / componentes afectados**

- Módulo de identidad en `apps/api`

**Resultado esperado**

El personal entra con OTP o Google. Un paciente no obtiene sesión.

**Validación**

- Tests: OTP válido, OTP reutilizado, Google de alguien que no es personal, refresh reutilizado y ruta de personal prohibida sin sesión.

**Estado**

- Pendiente

---

### TASK-006 — Alta de pacientes por el médico

**Objetivo**

Permitir que un médico cree la ficha del paciente, sin credenciales.

**Referencia**

- Requisito: RF-AUTH-1
- Criterio de aceptación: AC-AUTH-3

**Dependencias**

- TASK-005

**Alcance**

- Alta con los datos de perfil necesarios para citar y enviar correo.
- Listado de pacientes de ese médico.

**Fuera de alcance**

- Portal del paciente con contraseña.

**Archivos / componentes afectados**

- Identidad y perfiles en `apps/api`

**Resultado esperado**

El paciente existe como ficha clínica y no puede iniciar sesión.

**Validación**

- Test: el médico crea un paciente; ese correo no obtiene OTP de personal.

**Estado**

- Pendiente

---

## Fase 3 — Citas

### TASK-007 — Disponibilidad y ausencias

**Objetivo**

Definir bloques semanales y ausencias por médico.

**Referencia**

- Requisito: RF-CITA-1, RF-CITA-2
- Criterio de aceptación: AC-CITA-1

**Dependencias**

- TASK-003
- TASK-005

**Alcance**

- Alta y consulta de bloques y ausencias.
- Autorización: solo el médico dueño de esa agenda.

**Fuera de alcance**

- Reserva.

**Archivos / componentes afectados**

- Módulo de citas

**Resultado esperado**

Los bloques y las ausencias quedan persistidos y solo los edita quien puede.

**Validación**

- Test de permiso y de solape de bloque inválido si TASK-001 lo prohíbe.

**Estado**

- Pendiente

---

### TASK-008 — Cálculo de slots y reserva

**Objetivo**

Ofrecer horas libres y crear la cita con confirmación por correo.

**Referencia**

- Requisito: RF-CITA-3, RF-CITA-4, RF-CITA-7
- Criterio de aceptación: AC-CITA-1, AC-CITA-2

**Dependencias**

- TASK-004
- TASK-007

**Alcance**

- Listado de slots por especialidad, médico y fecha, según el modelo cerrado en TASK-001.
- Reserva en transacción con la restricción de unicidad.
- Correo de confirmación encolado.
- Estado inicial acordado.

**Fuera de alcance**

- Reprogramación y recordatorios.

**Archivos / componentes afectados**

- Módulo de citas

**Resultado esperado**

Una reserva válida persiste y encola el correo; un horario ocupado o fuera de bloque se rechaza.

**Validación**

- Tests de slot libre, vacaciones, solape y dos reservas concurrentes.

**Estado**

- Pendiente

---

### TASK-009 — Reprogramar, cancelar y recordar

**Objetivo**

Cambiar o cancelar una cita y programar el recordatorio.

**Referencia**

- Requisito: RF-CITA-5, RF-CITA-6
- Criterio de aceptación: AC-CITA-3, AC-CITA-4

**Dependencias**

- TASK-008

**Alcance**

- Transiciones de estado acordadas en TASK-001.
- Job de recordatorio.

**Fuera de alcance**

- Lista de espera.

**Archivos / componentes afectados**

- Módulo de citas y cola `reminders`

**Resultado esperado**

Reprogramar solo hacia un hueco libre. Cancelar y completar según la máquina de estados. El recordatorio se encola a la anticipación definida.

**Validación**

- Tests de transiciones inválidas y de horario destino ocupado.

**Estado**

- Pendiente

---

## Fase 4 — Recetas, documentos y entrega

### TASK-010 — Emisión de receta

**Objetivo**

Guardar diagnóstico e ítems ligados a la cita y pedir el PDF.

**Referencia**

- Requisito: RF-RX-1, RF-RX-2
- Criterio de aceptación: AC-RX-1

**Dependencias**

- TASK-005
- TASK-008

**Alcance**

- API de alta para el médico autorizado.
- Firma según el mecanismo cerrado en TASK-001.
- Token de verificación.

**Fuera de alcance**

- Maquetación final del PDF.

**Archivos / componentes afectados**

- Módulo de prescripciones

**Resultado esperado**

La receta y sus ítems quedan guardados y el trabajo de PDF encolado.

**Validación**

- Test de ítem incompleto y de médico que no puede emitir sobre esa cita.

**Estado**

- Pendiente

---

### TASK-011 — PDF con QR y subida privada

**Objetivo**

Generar el PDF, incrustar el QR a la URL de verificación y guardarlo en el bucket.

**Referencia**

- Requisito: RF-RX-3, RF-DIST-3
- Criterio de aceptación: AC-RX-1, AC-RX-2
- Decisión arquitectónica: DA-002, DA-003

**Dependencias**

- TASK-004
- TASK-010

**Alcance**

- Worker de PDF con la librería elegida.
- Imagen QR con `qrcode`.
- Objeto privado y clave persistida.

**Fuera de alcance**

- Página pública de verificación.

**Archivos / componentes afectados**

- Worker `pdf`, módulo de distribución

**Resultado esperado**

El PDF existe en el bucket y el QR apunta a `/v/:id?token=`.

**Validación**

- Test del worker con almacenamiento sustituto: el PDF se crea y la URL del QR coincide con el token.

**Estado**

- Pendiente

---

### TASK-012 — Documentos adjuntos

**Objetivo**

Subir PDF o imagen y descargarlo con URL temporal.

**Referencia**

- Requisito: RF-RX-4, RF-RX-5
- Criterio de aceptación: AC-RX-3

**Dependencias**

- TASK-003
- TASK-005

**Alcance**

- Validación de tipo.
- Subida privada.
- Descarga por presigned URL para el paciente dueño y el médico autorizado.

**Fuera de alcance**

- PIN del enlace, cubierto en TASK-013.

**Archivos / componentes afectados**

- Módulo de documentos

**Resultado esperado**

Un archivo permitido se guarda; otro tipo se rechaza; la descarga no usa una URL permanente.

**Validación**

- Tests de tipo inválido y de paciente que no es el dueño.

**Estado**

- Pendiente

---

### TASK-013 — Enlace, PIN y correo de entrega

**Objetivo**

Entregar la receta o el documento por correo con PDF o enlace, respetando expiración y PIN.

**Referencia**

- Requisito: RF-DIST-1, RF-DIST-2
- Criterio de aceptación: AC-DIST-1, AC-DIST-2

**Dependencias**

- TASK-006
- TASK-011
- TASK-012

**Alcance**

- Página o endpoint de verificación con el conjunto de datos cerrado en TASK-001.
- PIN y caducidad si se aprobaron.
- Job de correo de entrega.

**Fuera de alcance**

- Reenvío masivo.

**Archivos / componentes afectados**

- Distribución, `apps/web` ruta de verificación, cola `mail`

**Resultado esperado**

El enlace válido muestra solo lo acordado. El token malo, expirado o con PIN incorrecto no entrega el archivo.

**Validación**

- Tests de token, expiración y PIN.
- La respuesta de verificación no incluye otros documentos del paciente.

**Estado**

- Pendiente

---

## Fase 5 — Interfaz

### TASK-014 — Flujos de pantalla por rol

**Objetivo**

Cubrir en SvelteKit el registro, la agenda, la reserva, la receta y la verificación, en móvil y escritorio.

**Referencia**

- Requisito: usabilidad del SRS
- Criterio de aceptación: AC-AUTH-1, AC-CITA-2, AC-RX-1, AC-DIST-2

**Dependencias**

- TASK-006
- TASK-009
- TASK-013

**Alcance**

- Pantallas de los flujos principales con Tailwind y shadcn-svelte.
- Estados vacíos y de error de esos flujos.

**Fuera de alcance**

- Auditoría WCAG formal completa; sí revisión básica de etiquetas y contraste en las pantallas nuevas.

**Archivos / componentes afectados**

- `apps/web`

**Resultado esperado**

Un paciente reserva, un médico emite una receta y un tercero abre el enlace de verificación.

**Validación**

- Recorrido manual o E2E de reserva, receta y enlace inválido.
- Misma sesión coherente entre listado de citas y detalle.

**Estado**

- Pendiente

---

# Dependencias entre tareas

```text
TASK-001
   ↓
TASK-002 ──────────────→ TASK-004
   ↓
TASK-003 → TASK-005 → TASK-006
              ↓
           TASK-007 → TASK-008 → TASK-009
              ↓
           TASK-010 → TASK-011 ─┐
           TASK-012 ────────────┼→ TASK-013 → TASK-014
```

TASK-004 puede avanzar en paralelo con TASK-003 después de TASK-002. TASK-012 puede avanzar en paralelo con TASK-010.

---

# Orden de implementación

1. TASK-001
2. TASK-002
3. TASK-003 y TASK-004
4. TASK-005, TASK-006
5. TASK-007, TASK-008, TASK-009
6. TASK-010, TASK-011, TASK-012
7. TASK-013
8. TASK-014

# Especificación funcional — Plataforma médica

## Objetivo y alcance

Plataforma de gestión médica para pacientes, médicos y personal administrativo. Permite agendar citas presenciales o virtuales, emitir recetas digitales, adjuntar documentos clínicos y entregarlos por correo, enlace único o código QR.

### Dentro de alcance

- Registro e inicio de sesión con correo y contraseña, JWT y recuperación de contraseña por correo.
- Control de acceso por rol: paciente, médico, administrador/recepcionista.
- Disponibilidad horaria del médico, reserva, reprogramación, cancelación y recordatorios de citas.
- Emisión de recetas con ítems estructurados, firma del médico, PDF y QR de verificación.
- Carga de certificados, órdenes de exámenes y resultados, con almacenamiento restringido.
- Entrega por correo, enlace tokenizado y QR incrustado en el PDF.

### Fuera de alcance (no aparece en el requerimiento)

- Historia clínica completa más allá de recetas y documentos adjuntos.
- Videollamada o sala virtual de la cita.
- Facturación, pagos o seguros.
- Multi-sede o multi-clínica como modelo explícito.
- Firma electrónica cualificada con certificado de autoridad certificadora.
- App nativa.

## Actores

| Actor | Puede |
| --- | --- |
| Paciente | Registrarse, iniciar sesión, solicitar y gestionar sus citas, ver su historial, descargar sus recetas y documentos por enlace o QR. |
| Médico | Gestionar su agenda, atender consultas, emitir recetas y adjuntar documentos al historial del paciente. |
| Administrador / recepcionista | Gestionar disponibilidad del personal médico, usuarios y configuración de la clínica. |
| Tercero con el enlace o el QR | Acceder a la vista de verificación del documento, con el alcance de datos públicos aún por definir. |

El requerimiento agrupa administrador y recepcionista en un solo rol. No se distinguen permisos distintos entre ambos.

## Funcionalidades

### RF-AUTH — Autenticación y seguridad

- RF-AUTH-1: Registro e inicio de sesión con correo y contraseña.
- RF-AUTH-2: Sesión con JWT y rotación de refresh tokens.
- RF-AUTH-3: Acceso según rol (paciente, médico, administrador/recepcionista).
- RF-AUTH-4: Recuperación de contraseña por correo.

### RF-CITA — Agendamiento

- RF-CITA-1: Bloques de trabajo por médico, con día, hora de inicio, hora de fin y duración de consulta.
- RF-CITA-2: Vacaciones u otras ausencias que bloquean disponibilidad.
- RF-CITA-3: Reserva eligiendo especialidad, médico, fecha y hora disponible.
- RF-CITA-4: Correo de confirmación al reservar.
- RF-CITA-5: Reprogramación y cancelación.
- RF-CITA-6: Recordatorios automáticos.
- RF-CITA-7: Estados de cita: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

### RF-RX — Recetas y documentos

- RF-RX-1: Receta ligada a una cita, con diagnóstico e ítems (fármaco, dosis, frecuencia, duración, indicaciones).
- RF-RX-2: Firma digital o firma en imagen del médico.
- RF-RX-3: PDF de la receta generado de forma dinámica, con QR incrustado.
- RF-RX-4: Carga de certificados, órdenes o resultados en PDF o imagen, asociados a paciente y médico.
- RF-RX-5: Archivos en almacenamiento de objetos, accesibles por URL temporal o restringida.

### RF-DIST — Distribución

- RF-DIST-1: Envío por correo del PDF o de un enlace único.
- RF-DIST-2: URL con identificador y token, por ejemplo `/v/doc_123?token=xyz`, con expiración opcional o protección por contraseña o PIN.
- RF-DIST-3: QR que apunta a la URL de validación del documento.

## Reglas de negocio confirmadas

- RN-1: Una cita vincula un paciente y un médico, y tiene uno de los estados definidos.
- RN-2: La hora reservada debe caer en un bloque de disponibilidad del médico y respetar la duración del slot.
- RN-3: Vacaciones y ausencias impiden reservar en ese intervalo.
- RN-4: Al reservar se envía confirmación por correo.
- RN-5: La receta pertenece a una cita y contiene cero o más ítems de medicamento.
- RN-6: El PDF de la receta incluye un QR hacia la URL de validación.
- RN-7: Los archivos clínicos no quedan en URLs públicas permanentes; el acceso es temporal o restringido.
- RN-8: Cada rol solo opera sobre las capacidades descritas para ese actor.

## Reglas que faltan o necesitan confirmación

Ver sección Decisiones pendientes. En particular: quién confirma una cita `PENDING`, qué ve quien escanea el QR, política de PIN y expiración, modalidad presencial/virtual, y si un médico solo ve a sus pacientes.

## Entidades y relaciones

Confirmadas por el esquema simplificado:

- `User` 1—1 `Profile`.
- `User` (médico) 1—N `DoctorAvailability`.
- `User` (paciente) 1—N `Appointment`; `User` (médico) 1—N `Appointment`.
- `Appointment` 1—N `Prescription` (el esquema no limita a una receta por cita).
- `Prescription` 1—N `PrescriptionItem`.
- `MedicalDocument` pertenece a un paciente y a un médico.

Mencionadas en el texto y ausentes del esquema: especialidad, vacaciones, modalidad de cita, firma del médico, expiración y PIN del enlace, tokens de recuperación y refresh tokens. No se incorporan como requisito de datos hasta confirmarlas.

## Flujos

### Reserva de cita

1. El paciente elige especialidad, médico, fecha y un horario libre.
2. El sistema crea la cita y envía el correo de confirmación.
3. El estado inicial no está definido: el esquema incluye `PENDING` y `CONFIRMED`.

### Atención y receta

1. El médico atiende una cita.
2. Registra diagnóstico e ítems.
3. El sistema genera el PDF con firma y QR.
4. El paciente recibe el PDF o un enlace por correo, y puede abrirlo por enlace o QR.

### Documento adjunto

1. El médico carga un PDF o una imagen para un paciente.
2. El archivo queda en almacenamiento privado.
3. La descarga usa una URL temporal o un enlace tokenizado.

### Verificación por QR

1. Un tercero escanea el QR.
2. Llega a la URL de validación.
3. La información visible está pendiente de definición.

## Estados y transiciones

Cita: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

Transiciones no definidas en el requerimiento. Propuesta solo como hipótesis de trabajo, no como regla:

- Crear → `PENDING` o `CONFIRMED`.
- Confirmar → `CONFIRMED`.
- Cancelar desde `PENDING` o `CONFIRMED` → `CANCELLED`.
- Completar una cita confirmada → `COMPLETED`.

No hay máquina de estados para recetas ni documentos.

## Validaciones

- Correo único y contraseña en el registro (política de complejidad no especificada).
- Rol obligatorio y perteneciente al conjunto definido.
- Slot dentro del bloque del médico, sin solaparse con otra cita ni con una ausencia.
- Ítem de receta con fármaco, dosis, frecuencia y duración.
- Adjunto limitado a PDF o imagen.
- Token de acceso inválido, expirado o sin PIN correcto no entrega el archivo.

Los umbrales (longitud de contraseña, tamaño máximo de archivo, TTL del enlace) no están en el requerimiento.

## Manejo de errores

- Credenciales inválidas: rechazar el acceso sin revelar si el correo existe.
- Horario no disponible: rechazar la reserva.
- Rol insuficiente: rechazar la operación.
- Token de documento inválido o expirado: denegar la descarga.
- Fallo de correo o de PDF: la operación de negocio no debe depender de que el envío termine en la misma petición; el reproceso queda en la arquitectura.

## Criterios de aceptación

- AC-AUTH-1: Un usuario se registra con correo y contraseña e inicia sesión.
- AC-AUTH-2: Un access token vencido se renueva rotando el refresh token; el refresh anterior deja de servir.
- AC-AUTH-3: Un paciente no gestiona disponibilidad ni usuarios; un médico no administra la configuración de la clínica.
- AC-AUTH-4: Quien solicita recuperar la contraseña recibe un correo y puede definir una nueva.
- AC-CITA-1: Solo se ofrecen horas dentro de los bloques del médico, fuera de vacaciones y no ocupadas.
- AC-CITA-2: Al reservar, el paciente recibe un correo de confirmación.
- AC-CITA-3: Paciente o personal autorizado puede reprogramar y cancelar según las reglas que se confirmen.
- AC-CITA-4: Un recordatorio se envía antes de la cita por el mecanismo automático definido.
- AC-RX-1: Una receta guardada produce un PDF con diagnóstico, ítems, firma y QR.
- AC-RX-2: El QR abre la URL de validación de esa receta.
- AC-RX-3: Un adjunto PDF o imagen queda almacenado y solo se descarga con acceso temporal o token válido.
- AC-DIST-1: El correo de entrega incluye el PDF o un enlace único.
- AC-DIST-2: Un enlace expirado o con PIN incorrecto no muestra el documento.

## Casos borde

- Dos reservas simultáneas del mismo slot.
- Reprogramar a un horario que deja de estar libre.
- Cancelar una cita ya completada o ya cancelada.
- Médico sin bloques definidos.
- Receta sin ítems.
- Firma ausente al emitir.
- Archivo que no es PDF ni imagen, o que supera un tamaño aún no definido.
- QR o enlace usado después de expirar, o compartido con terceros.
- Correo de confirmación o recordatorio que falla.
- Recuperación de contraseña con token ya usado.

## Casos de prueba

- Registro, login, refresh rotado y rechazo de refresh reutilizado.
- Recuperación de contraseña: token válido, expirado y reutilizado.
- RBAC por cada rol en citas, recetas, documentos y usuarios.
- Cálculo de slots: bloque, duración, vacaciones y solapes.
- Reserva concurrente del mismo slot: una sola cita persistida.
- Transiciones de estado de cita permitidas y rechazadas.
- Generación de PDF con QR que resuelve al documento correcto.
- URL pre-firmada caducada y token de acceso inválido.
- PIN correcto e incorrecto cuando la protección esté activa.
- Encolado de correo y PDF: la API responde sin esperar al envío.

## Decisiones pendientes

1. **Vista pública del QR.** El SRS pide decidir qué datos ve un tercero. Afecta privacidad y el criterio AC-DIST de verificación. Alternativas: solo validez y nombre del médico; validez más paciente parcial; documento completo tras PIN.
2. **Estado inicial de la cita y quién confirma.** Afecta RN de estados y los correos. Alternativas: nace `CONFIRMED`; nace `PENDING` y la confirma recepción o el médico.
3. **Quién reprograma y cancela, y hasta cuándo.** Afecta AC-CITA-3.
4. **Contenido y anticipación del recordatorio.** Afecta AC-CITA-4.
5. **Especialidad.** La reserva la exige y el esquema no la modela. Alternativas: catálogo de especialidades y médicos N—N; texto libre en el perfil.
6. **Modalidad presencial o virtual.** Está en la descripción y no en el esquema.
7. **Firma.** “Digital o imagen” no elige mecanismo ni si es obligatoria.
8. **Política del enlace:** expiración, PIN, un solo uso, y si aplica igual a recetas y a documentos.
9. **Alcance del administrador frente al recepcionista.** Hoy son el mismo rol.
10. **Un médico y el historial.** No dice si ve solo sus pacientes o cualquier paciente de la clínica.
11. **Varias recetas por cita** y si el documento adjunto debe ligarse a una cita.
12. **Jurisdicción de datos de salud** (HIPAA u otra). Afecta retención, cifrado y registro de accesos, no el flujo básico.
13. **Política de contraseñas, verificación de correo en el registro y bloqueo por intentos.** No están especificados.

## Supuestos (no son requisitos)

- Una sola clínica en la primera versión.
- El paciente solo ve sus citas, recetas y documentos.
- El correo de confirmación no sustituye la regla de negocio de la reserva: la cita existe aunque el envío se retrase.

# Especificación funcional — Plataforma médica

## Objetivo y alcance

Herramienta para un médico freelance con consultorio propio. Cada médico es un espacio aislado: sus pacientes, su agenda, sus recetas y su enlace público de reserva. No hay clínica ni agencia que agrupe varios médicos. Permite agendar citas presenciales o virtuales, emitir recetas digitales, adjuntar documentos y entregarlos por correo, enlace único o código QR.

### Dentro de alcance

- El médico crea su cuenta con OTP por correo o Google OAuth, y JWT. El paciente no tiene cuenta.
- Un solo rol con sesión: el médico dueño de su consultorio.
- Disponibilidad horaria del médico, reserva, reprogramación, cancelación y recordatorios de citas.
- Emisión de recetas con ítems estructurados, firma del médico, PDF y QR de verificación.
- Carga de certificados, órdenes de exámenes y resultados, con almacenamiento restringido.
- Entrega por correo, enlace tokenizado y QR incrustado en el PDF.

### Fuera de alcance (no aparece en el requerimiento)

- Historia clínica completa más allá de recetas y documentos adjuntos.
- Videollamada o sala virtual de la cita.
- Facturación, pagos o seguros.
- Clínica, agencia o directorio que administre varios médicos.
- Recepcionista o administrador en la primera versión. Si más adelante un médico invita a un asistente, ese asistente solo ve el consultorio de quien lo invitó.
- Firma electrónica cualificada con certificado de autoridad certificadora.
- App nativa.

## Actores

| Actor | Puede |
| --- | --- |
| Paciente | Sin cuenta. Reserva una cita, y la reprograma o cancela con el enlace del correo hasta 24 horas antes. Recibe recetas y documentos por enlace o QR. |
| Médico | Crea su cuenta con OTP o Google. Define su enlace público, su agenda y sus especialidades. Crea pacientes, atiende, emite recetas y adjunta documentos. Solo ve su consultorio. |
| Tercero con el enlace o el QR | Ve si el documento es válido, el médico y la fecha. No ve datos clínicos. |

## Funcionalidades

### RF-AUTH — Autenticación y seguridad

- RF-AUTH-1: El paciente no tiene cuenta. Lo crea un médico, o queda creado al reservar si ese correo no existía.
- RF-AUTH-2: Sesión del personal con JWT y rotación de refresh tokens.
- RF-AUTH-3: La sesión es del médico y solo autoriza datos de su consultorio.
- RF-AUTH-4: El médico se registra solo, con OTP por correo o con Google. No hay invitación ni contraseña.

### RF-CITA — Agendamiento

- RF-CITA-1: Bloques de trabajo por médico, con día, hora de inicio, hora de fin y duración de consulta.
- RF-CITA-2: Vacaciones u otras ausencias que bloquean disponibilidad.
- RF-CITA-3: El paciente abre el enlace del médico, elige modalidad (presencial o virtual), fecha y hora disponible. No elige entre varios médicos.
- RF-CITA-4: Correo de confirmación al reservar. La cita nace `CONFIRMED`.
- RF-CITA-5: Reprogramación y cancelación hasta 24 horas antes por el paciente, con el enlace del correo. El médico puede hacerlo sobre sus citas también después de ese plazo.
- RF-CITA-6: Recordatorios automáticos 24 horas antes y 2 horas antes.
- RF-CITA-7: Estados de cita: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`. El alta usa `CONFIRMED`.

### RF-RX — Recetas y documentos

- RF-RX-1: Una cita puede tener varias recetas. Cada una lleva diagnóstico e ítems (fármaco, dosis, frecuencia, duración, indicaciones).
- RF-RX-2: Firma en imagen subida por el médico.
- RF-RX-3: PDF de la receta generado de forma dinámica, con QR incrustado.
- RF-RX-4: Carga de certificados, órdenes o resultados en PDF o imagen, ligados a una cita, a un paciente y a un médico.
- RF-RX-5: Archivos en almacenamiento de objetos, accesibles por URL temporal o restringida.

### RF-DIST — Distribución

- RF-DIST-1: Envío por correo del PDF o de un enlace único.
- RF-DIST-2: URL con identificador y token, por ejemplo `/v/doc_123?token=xyz`. Caduca a los 30 días. No pide PIN.
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
- RN-9: La especialidad es un catálogo. Un médico puede tener varias.
- RN-10: Pacientes, citas, recetas y documentos pertenecen a un solo médico. El mismo correo en dos consultorios son dos fichas distintas.
- RN-11: Quien abre el enlace o el QR, sin sesión de paciente, ve únicamente si el documento es válido, el médico y la fecha. No ve datos clínicos.
- RN-12: El enlace de receta o documento deja de servir a los 30 días.

## Reglas que faltan o necesitan confirmación

Dentro de un consultorio, si el correo ya tiene ficha se reutiliza; si no, la reserva la crea. No se cruza con las fichas de otro médico.

## Entidades y relaciones

Confirmadas por el esquema simplificado:

- `User` 1—1 `Profile`.
- `User` (médico) 1—N `DoctorAvailability`.
- `User` (paciente) 1—N `Appointment`; `User` (médico) 1—N `Appointment`.
- `Appointment` 1—N `Prescription` (el esquema no limita a una receta por cita).
- `Prescription` 1—N `PrescriptionItem`.
- `MedicalDocument` pertenece a un paciente y a un médico.

Además del esquema simplificado hacen falta: catálogo de especialidades (médico N—N especialidad), ausencias, modalidad en la cita, imagen de firma del médico, caducidad del enlace (30 días), varias recetas por cita, documento ligado a la cita, refresh tokens, tokens de recuperación y la identidad de Google y de OTP.

## Flujos

### Reserva de cita

1. El paciente abre el enlace público de ese médico y elige modalidad, fecha y un horario libre.
2. El sistema crea la cita en `CONFIRMED` y envía el correo de confirmación.
3. Envía recordatorio 24 horas antes y otro 2 horas antes.

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
3. Ve si el documento es válido, el nombre del médico y la fecha. No ve diagnóstico, fármacos ni el archivo.

## Estados y transiciones

Cita: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

- Crear → `CONFIRMED`.
- Cancelar desde `CONFIRMED` → `CANCELLED`. El paciente solo hasta 24 horas antes; el médico de esa cita, en cualquier momento previo a completarla.
- Completar una cita confirmada → `COMPLETED`.
- `PENDING` permanece en el modelo y no se usa al reservar.

No hay máquina de estados para recetas ni documentos.

## Validaciones

- El correo del personal es único. El código OTP caduca y es de un solo uso.
- Rol obligatorio y perteneciente al conjunto definido.
- Slot dentro del bloque del médico, sin solaparse con otra cita ni con una ausencia.
- Ítem de receta con fármaco, dosis, frecuencia y duración.
- Adjunto limitado a PDF o imagen.
- Token de acceso inválido o expirado (más de 30 días) no entrega el archivo.

## Manejo de errores

- Credenciales inválidas: rechazar el acceso sin revelar si el correo existe.
- Horario no disponible: rechazar la reserva.
- Rol insuficiente: rechazar la operación.
- Token de documento inválido o expirado: denegar la descarga.
- Fallo de correo o de PDF: la operación de negocio no debe depender de que el envío termine en la misma petición; el reproceso queda en la arquitectura.

## Criterios de aceptación

- AC-AUTH-1: Un médico crea su cuenta y entra con un OTP de correo o con Google, sin contraseña.
- AC-AUTH-2: Un access token vencido se renueva rotando el refresh token; el refresh anterior deja de servir.
- AC-AUTH-3: Quien no tiene sesión de personal no gestiona disponibilidad, usuarios ni recetas. El paciente opera su cita solo con el enlace del correo.
- AC-AUTH-4: Un OTP usado o vencido no abre sesión.
- AC-CITA-1: Solo se ofrecen horas dentro de los bloques del médico, fuera de vacaciones y no ocupadas.
- AC-CITA-2: Al reservar, el paciente recibe un correo de confirmación.
- AC-CITA-3: El paciente reprograma o cancela con su enlace hasta 24 horas antes. El médico puede hacerlo sobre sus citas. Un médico no ve citas de otro.
- AC-CITA-4: Un recordatorio se envía antes de la cita por el mecanismo automático definido.
- AC-RX-1: Una receta guardada produce un PDF con diagnóstico, ítems, firma y QR.
- AC-RX-2: El QR abre la URL de validación de esa receta.
- AC-RX-3: Un adjunto PDF o imagen queda almacenado y solo se descarga con acceso temporal o token válido.
- AC-DIST-1: El correo de entrega incluye el PDF o un enlace único.
- AC-DIST-2: Un enlace expirado no muestra el documento. Uno vigente, abierto sin ser el paciente, muestra solo validez, médico y fecha.

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
- OTP reutilizado o vencido.

## Casos de prueba

- Registro, login, refresh rotado y rechazo de refresh reutilizado.
- OTP válido, expirado y reutilizado. Login con Google de una cuenta no autorizada.
- RBAC por cada rol en citas, recetas, documentos y usuarios.
- Cálculo de slots: bloque, duración, vacaciones y solapes.
- Reserva concurrente del mismo slot: una sola cita persistida.
- Transiciones de estado de cita permitidas y rechazadas.
- Generación de PDF con QR que resuelve al documento correcto.
- URL pre-firmada caducada y token de acceso inválido.
- Verificación pública sin diagnóstico ni archivo.
- Encolado de correo y PDF: la API responde sin esperar al envío.

## Decisiones cerradas

- Verificación pública: validez, médico y fecha. Sin datos clínicos ni PIN.
- La cita nace confirmada.
- Reprograman y cancelan el paciente (hasta 24 horas antes, con el enlace) y el médico (sus citas).
- Recordatorio a las 24 horas y a las 2 horas.
- Catálogo de especialidades, varias por médico.
- La cita guarda si es presencial o virtual.
- Firma: imagen subida por el médico.
- Enlace con caducidad de 30 días, sin PIN.
- No hay rol de clínica ni de recepción en la primera versión.
- Cada médico solo ve su consultorio.
- Varias recetas por cita. El documento adjunto también se liga a la cita.
- Protección de datos personales local. No se certifica HIPAA en esta versión.
- El personal entra con OTP por correo o con Google. No hay contraseña.
- El paciente no tiene usuario. El médico puede crear la ficha. Al reservar en su enlace, el correo se reutiliza dentro de ese consultorio o se crea la ficha ahí.
- El médico se registra solo. No hace falta invitación ni administrador inicial.
- Cancelar o reprogramar solo hasta 24 horas antes.

## Decisiones pendientes

La plataforma de despliegue y la duración de los tokens no cambian los flujos. Un asistente invitado por el médico queda fuera de la primera versión.

## Supuestos (no son requisitos)

- El médico comparte su propio enlace. No hay un buscador público de médicos en la primera versión.
- El paciente solo ve la cita, la receta o el documento para los que tiene enlace.
- El correo de confirmación no sustituye la regla de negocio de la reserva: la cita existe aunque el envío se retrase.

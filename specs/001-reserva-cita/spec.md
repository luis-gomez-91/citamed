# Reserva de cita

## Objetivo

Un paciente, sin cuenta, abre el enlace público de un médico, ve horas libres y reserva una. El médico define los bloques y las ausencias de su consultorio. La hora reservada deja de ofrecerse.

Esta feature cubre el agendamiento inicial. No cubre reprogramar, cancelar, recordatorios, recetas ni documentos.

## Trazabilidad

Requisitos y criterios ya cerrados en `docs/spec.md`:

- RF-CITA-1, RF-CITA-2, RF-CITA-3, RF-CITA-4, RF-CITA-7
- RF-AUTH-1 (la ficha del paciente nace o se reutiliza al reservar, dentro de ese consultorio)
- RN-1, RN-2, RN-3, RN-4, RN-10
- AC-CITA-1, AC-CITA-2

Fuera de esta feature, aunque ya estén en la especificación global: RF-CITA-5, RF-CITA-6, AC-CITA-3, AC-CITA-4, y todo RF-RX y RF-DIST.

## Actores

| Actor | En esta feature |
| --- | --- |
| Médico | Define bloques de trabajo y ausencias de su consultorio. Solo ve y edita su agenda. |
| Paciente | Sin cuenta. Elige modalidad, fecha y hora en el enlace de ese médico, e indica el correo con el que se crea o reutiliza su ficha en ese consultorio. |

## Alcance

- Bloques de trabajo por médico: día, hora de inicio, hora de fin y duración de la consulta.
- Ausencias que bloquean un intervalo.
- Enlace público de un solo médico. El paciente no elige entre varios.
- Modalidad presencial o virtual en la cita.
- Listado de horas libres: dentro de un bloque, fuera de ausencias y no ocupadas.
- La reserva persiste la cita en `CONFIRMED` y envía el correo de confirmación. La cita existe aunque el envío se retrase.
- Un mismo horario activo no se entrega dos veces, tampoco si dos reservas llegan a la vez.
- El correo del paciente se reutiliza si ya tiene ficha en ese consultorio. Si no, la reserva crea la ficha ahí. No se cruza con otro médico.

## Fuera de alcance

- Registro e inicio de sesión del médico (OTP y Google). Esta feature asume que el médico ya puede autenticarse en su consultorio.
- Reprogramación, cancelación, estado `COMPLETED` y recordatorios.
- `PENDING` permanece en el modelo y no se usa al reservar.
- Especialidades, recetas, PDF, documentos y verificación.
- Buscador público de médicos.
- Videollamada: la modalidad virtual solo se guarda en la cita.

## Reglas de negocio

- La hora reservada cae dentro de un bloque del médico y respeta la duración del slot.
- Una ausencia impide reservar en ese intervalo.
- La cita vincula un paciente y un médico, y nace en `CONFIRMED`.
- Pacientes y citas pertenecen a un solo médico.
- Dos citas activas del mismo médico no comparten fecha y hora. `CANCELLED` no ocupa el hueco; esta feature no crea citas canceladas.

## Flujo

1. El médico registra bloques y, si aplica, ausencias.
2. El paciente abre el enlace público de ese médico.
3. Elige modalidad, fecha y una hora libre, e indica su correo.
4. El sistema crea o reutiliza la ficha del paciente en ese consultorio, persiste la cita en `CONFIRMED` y encola el correo de confirmación.
5. Esa hora deja de aparecer como libre.

## Validaciones y errores

- Horario fuera de bloque, en ausencia o ya ocupado: se rechaza la reserva.
- Dos reservas simultáneas del mismo slot: solo una queda persistida.
- Médico sin bloques: no hay horas que ofrecer.
- Quien no es el médico de esa agenda no edita bloques ni ausencias.
- El fallo del correo no deshace la cita.

## Casos borde

- Dos reservas simultáneas del mismo slot.
- Médico sin bloques definidos.
- Ausencia que cubre parte de un bloque.
- Correo de confirmación que falla o se retrasa.
- El mismo correo reserva otra vez en el mismo consultorio.
- El mismo correo reserva con otro médico: es otra ficha.

## Criterios de aceptación

- AC-CITA-1: solo se ofrecen horas dentro de los bloques del médico, fuera de ausencias y no ocupadas.
- AC-CITA-2: al reservar, el paciente recibe un correo de confirmación.
- La cita queda en `CONFIRMED`.
- Una reserva duplicada del mismo horario activo del mismo médico no persiste.
- Un médico no edita la agenda de otro.

## Impacto en la arquitectura

No cambia las decisiones cerradas. Usa el monorepo `apps/api` y `apps/web`, Prisma y PostgreSQL, y la reserva en una transacción con restricción de unicidad. El correo sale de la petición por la cola (BullMQ y Redis), como en DA-002.

Hoy el repositorio no tiene Prisma, el módulo de citas ni la cola. Esta feature los introduce solo en lo necesario para bloques, ausencias, slots y la reserva. No adelanta prescripciones ni documentos.

La pantalla pública de reserva y la de agenda del médico son las primeras rutas de producto. El detalle visual no está en la especificación.

## Decisiones de esta feature

Cerradas para poder planificar, porque no estaban en `docs/spec.md`:

1. Cada consultorio guarda una zona horaria IANA. Día y hora de los bloques se interpretan en esa zona.
2. El enlace público usa un slug único elegido por el médico, no el id interno.
3. Al reservar son obligatorios el nombre y el correo. El teléfono no forma parte de esta feature.
4. Dos bloques del mismo médico no pueden solaparse el mismo día.
5. Esta feature incluye encolar el correo de confirmación. La cita queda persistida aunque el envío se retrase.

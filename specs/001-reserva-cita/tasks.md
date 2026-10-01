# Tareas — Reserva de cita

Identificadores `FEAT-001-n`. El estado cambia a Hecha solo con la validación ejecutada.

## FEAT-001-1 — Horas libres

**Objetivo**

Calcular las horas ofrecibles de un día.

**Trazabilidad**

RF-CITA-1, RF-CITA-2, RF-CITA-3, RN-2, RN-3, AC-CITA-1.

**Dependencias**

Ninguna.

**Alcance**

Función pura: bloques del día, duración, ausencias, citas ya tomadas y zona horaria. Cada slot cabe entero en el bloque. Una ausencia o una cita ocupada lo retiran.

**Fuera de alcance**

Persistencia, HTTP y correo.

**Validación**

Tests: slot dentro del bloque, slot que no cabe, ausencia, cita ocupada, otro día de la semana.

**Estado**

Hecha

## FEAT-001-2 — Bloques que se solapan

**Objetivo**

Rechazar dos bloques del mismo médico que se cruzan el mismo día.

**Trazabilidad**

Decisión 4 de `spec.md`.

**Dependencias**

FEAT-001-1

**Alcance**

Validación pura del solape. El mismo instante de fin e inicio no es solape.

**Fuera de alcance**

Persistencia.

**Validación**

Tests de solape y de bloques contiguos.

**Estado**

Hecha

## FEAT-001-3 — Esquema de reserva

**Objetivo**

Persistir consultorio, paciente, bloque, ausencia y cita.

**Trazabilidad**

RN-1, RN-10, decisiones 1 a 3.

**Dependencias**

FEAT-001-2

**Alcance**

Prisma, migración y restricción de una cita no cancelada por médico e inicio. Slug único. Zona IANA. Nombre y correo del paciente.

**Fuera de alcance**

Endpoints.

**Validación**

Migración sobre PostgreSQL vacío. Email duplicado dentro del mismo consultorio falla. El mismo correo en otro consultorio no falla. Dos citas activas en el mismo inicio fallan.

**Estado**

Pendiente

## FEAT-001-4 — Guardar agenda

**Objetivo**

Crear y listar bloques y ausencias del médico indicado.

**Trazabilidad**

RF-CITA-1, RF-CITA-2. Un médico no edita la agenda de otro.

**Dependencias**

FEAT-001-3

**Alcance**

Caso de uso con el id del médico. Rechaza bloques solapados y una ausencia que no tiene fin posterior al inicio.

**Fuera de alcance**

HTTP y reserva.

**Validación**

Tests del caso de uso con base de prueba: alta, listado y rechazo de agenda ajena.

**Estado**

Pendiente

## FEAT-001-5 — Reservar

**Objetivo**

Crear o reutilizar la ficha y persistir la cita en `CONFIRMED` solo si el slot sigue libre.

**Trazabilidad**

RF-CITA-3, RF-CITA-7, RF-AUTH-1, RN-1, RN-2, RN-10, AC-CITA-1.

**Dependencias**

FEAT-001-4

**Alcance**

Transacción. Nombre y correo obligatorios. Modalidad presencial o virtual. Carrera de dos reservas: una sola cita.

**Fuera de alcance**

Correo y pantalla.

**Validación**

Tests de slot libre, ausencia, ocupado, ficha reutilizada, ficha nueva y dos reservas concurrentes.

**Estado**

Pendiente

## FEAT-001-6 — Correo de confirmación

**Objetivo**

Encolar el correo después de persistir la cita.

**Trazabilidad**

RF-CITA-4, RN-4, AC-CITA-2.

**Dependencias**

FEAT-001-5

**Alcance**

Productor de un trabajo con destinatario, médico, inicio y modalidad. Si la cola falla, la cita permanece.

**Fuera de alcance**

Plantilla visual, recordatorios y proveedor real en el test.

**Validación**

Test con doble de cola: se encola tras reservar. Si el doble falla, la cita sigue guardada.

**Estado**

Pendiente

## FEAT-001-7 — HTTP

**Objetivo**

Exponer agenda del médico y reserva pública por slug.

**Trazabilidad**

AC-CITA-1 y el rechazo de agenda ajena.

**Dependencias**

FEAT-001-6

**Alcance**

Rutas de bloques, ausencias, horas libres y reserva. La agenda exige el id del médico autenticado que inyecte el módulo de identidad. Esta tarea no implementa OTP ni Google.

**Fuera de alcance**

Pantallas.

**Validación**

Tests de controlador: reserva válida, horario rechazado y agenda de otro médico rechazada.

**Estado**

Pendiente

## FEAT-001-8 — Pantallas

**Objetivo**

El médico edita su agenda y el paciente reserva en el enlace.

**Trazabilidad**

RF-CITA-1, RF-CITA-2, RF-CITA-3.

**Dependencias**

FEAT-001-7

**Alcance**

Rutas en `apps/web` para bloques, ausencias y la reserva pública. Nombre, correo, modalidad, fecha y hora.

**Fuera de alcance**

Reprogramar, cancelar y recetas.

**Validación**

Recorrido en el navegador: sin bloques no hay horas; una reserva confirmada ocupa el hueco; un segundo intento del mismo hueco se rechaza.

**Estado**

Pendiente

# Plan — Reserva de cita

## Enfoque

La regla de horas libres vive en funciones puras, sin base de datos. La persistencia y la HTTP llegan después, cuando el cálculo ya está cubierto por tests. El correo se encola al final del flujo de reserva y no decide si la cita existe.

## Decisiones aplicadas

- Zona IANA en el consultorio.
- Slug único en la URL pública.
- Nombre y correo obligatorios al reservar.
- Bloques solapados del mismo día rechazados.
- Confirmación por correo encolada.

## Capas

1. Dominio en `apps/api`: slots libres y validación de bloques.
2. Prisma y PostgreSQL: consultorio, paciente, bloque, ausencia y cita. Unicidad de cita activa por médico e instante de inicio.
3. Casos de uso que persisten bloques, ausencias y la reserva en una transacción.
4. HTTP: agenda autenticada del médico y reserva pública por slug. El guard de sesión no se construye aquí; se asume el médico autenticado que entregue la identidad existente. Hasta que exista ese módulo, los casos de uso se prueban con el id del médico.
5. Cola: un trabajo de correo de confirmación después de persistir. Sin Redis en local, el productor se prueba con un doble.
6. Web: el médico edita bloques y ausencias; el paciente reserva en la ruta del slug.

## Fuera de este plan

Reprogramar, cancelar, recordatorios, OTP, Google, recetas y documentos.

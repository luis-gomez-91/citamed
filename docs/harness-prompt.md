# Harness de implementación

Usa este prompt al implementar una tarea de `docs/tasks.md`. No implementes varias tareas en la misma sesión salvo que quien pide el trabajo lo indique.

## Contexto obligatorio

Lee antes de escribir código:

- `docs/spec.md`
- `docs/architecture.md`
- `docs/tasks.md` (solo la tarea indicada y sus dependencias)

## Instrucciones

Implementa únicamente la tarea indicada.

- Respeta los requisitos y criterios de aceptación citados en la tarea.
- No conviertas una decisión pendiente en comportamiento definitivo. Si la tarea depende de una decisión abierta, detente y pídela.
- No añadas módulos, proveedores ni pantallas que la tarea marque fuera de alcance.
- Sigue las decisiones técnicas cerradas. Prisma, BullMQ, clave de objeto en el bucket y el monorepo `apps/api` + `apps/web` valen mientras no se hayan revocado en la documentación.
- Deja tests o la validación descrita en la tarea, y ejecútalos antes de dar la tarea por hecha.

## Formato de cierre

Al terminar, informa:

- Qué quedó implementado.
- Qué validación se ejecutó y el resultado.
- Qué decisiones siguen abiertas, si la tarea las tocó.

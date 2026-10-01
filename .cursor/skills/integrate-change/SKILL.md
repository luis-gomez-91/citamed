---
name: integrate-change
description: >-
  Integra cambios de CitaMed por pull request, con las comprobaciones
  del workflow, y auto-merge a main. Usar al abrir un pull request,
  integrar, mezclar a main o desplegar. Dokploy despliega main; no hay
  deploy en el workflow de comprobaciones.
---

# Integrar un cambio

No hagas push a `main`. La regla global lo prohíbe.

## Pasos

1. Crea una rama desde `main` actualizado.
2. Abre el pull request hacia `main`.
3. Las comprobaciones del pull request deben quedar en verde:
   - `apps/api`: `npm run lint` y `npm test`
   - `apps/web`: `npm run check` y `npm run lint`
4. Activa el auto-merge cuando esas comprobaciones pasen: `gh pr merge --auto --squash`.
5. No merges a mano si las comprobaciones aún no existen o están en rojo.

## Despliegue

Dokploy despliega al entrar el commit en `main`. No añadas un job de deploy en las comprobaciones. No despliegues una rama de pull request a producción.

## Migraciones

No ejecutes migraciones de base de datos en el workflow de comprobaciones. Un check verde no aplica cambios de esquema en producción.

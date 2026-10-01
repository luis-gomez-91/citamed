# CitaMed

Plataforma de citas médicas. El navegador habla con una aplicación SvelteKit; las operaciones de negocio van a una API NestJS.

## Estructura

- `apps/web`: frontend SvelteKit, Tailwind CSS y adapter Node.
- `apps/api`: API NestJS.
- `docs/architecture.md`: arquitectura prevista (PostgreSQL, Prisma, colas, almacenamiento).

Requiere Node.js 22 o superior. Cada aplicación tiene su propio `package-lock.json`.

## Desarrollo

```bash
npm --prefix apps/api install
npm --prefix apps/web install

npm run dev:api
npm run dev:web
```

Desde la raíz también están `npm run build`, `npm run lint` y `npm run check`.

## Despliegue

Cada app se construye por separado con Nixpacks (`apps/api/nixpacks.toml` y `apps/web/nixpacks.toml`) y se despliega desde Dokploy cuando entra un cambio en `main`.

# ⚡ ElectriSaaS (Presupuestador)

Herramienta web para armar, ajustar y compartir presupuestos de obras eléctricas de forma rápida y profesional.

---

## ¿Qué problema resuelve?

Armar un presupuesto a mano (Excel, Word, papel) es lento y propenso a errores: hay que buscar precios, sumar a mano, ajustar por inflación y después pasarlo en limpio para mandárselo al cliente. ElectriSaaS automatiza todo ese proceso:

1. Elegís los materiales de un catálogo
2. El sistema calcula el total automáticamente, con un ajuste por inflación configurable
3. Cargás los datos del cliente
4. Generás un link público con el presupuesto listo para compartir o descargar en PDF

---

## Cómo se usa, de principio a fin

### 1. Registro e ingreso

El profesional se registra con nombre, empresa (opcional), matrícula (opcional), teléfono, email y contraseña. Al registrarse se cierra la sesión automáticamente y se lo redirige al login con un mensaje de confirmación; luego ingresa con sus credenciales. Sus datos se copian al perfil (`profiles`) mediante un trigger de base de datos y se usan como encabezado en los presupuestos.

También hay recuperación de contraseña: el usuario recibe un mail con un link que lo lleva a `/auth/reset-password`.

### 2. Armar el presupuesto

El usuario ve un catálogo de materiales agrupado por categorías (cables, protecciones, etc.). Cada categoría se expande y colapsa. Dentro de cada una, con `+` / `-` o escribiendo el número, se elige la cantidad de cada item (máximo 999).

### 3. Ajustar por inflación

Un control deslizante aplica un porcentaje de ajuste sobre todos los precios a la vez.

### 4. Completar los datos del cliente

Formulario con nombre, WhatsApp, dirección y fecha de validez (por defecto, 5 días desde hoy). Valida formato de teléfono y que la fecha no sea anterior a hoy.

### 5. Guardado automático

El progreso (cantidades, inflación y datos del cliente) se guarda como borrador en la base de datos, asociado a la cuenta del usuario, con un debounce de 800 ms. Si cierra la pestaña o cambia de dispositivo, retoma donde dejó.

### 6. Compartir o descargar

Con un click se genera un link público único (`/share/<id>`), listo para:

- Copiarlo y enviarlo por WhatsApp o email
- Abrirlo con `?print=1` para imprimirlo o guardarlo como PDF desde el navegador

El presupuesto queda **congelado**: se guarda un snapshot de nombre, categoría y precio de cada item, así que si el catálogo cambia después, el documento ya enviado no se modifica.

---

## Rutas

| Ruta                    | Acceso  | Descripción                                            |
| ----------------------- | ------- | ------------------------------------------------------ |
| `/`                     | Privada | Presupuestador                                         |
| `/auth/login`           | Pública | Inicio de sesión                                       |
| `/auth/register`        | Pública | Registro de profesional                                |
| `/auth/forgot-password` | Pública | Solicitar recuperación de contraseña                   |
| `/auth/reset-password`  | Pública | Definir nueva contraseña (desde el link del mail)      |
| `/share/[id]`           | Pública | Presupuesto compartido (el cliente no necesita cuenta) |

La protección de rutas está en `src/proxy.ts`:

- Sin sesión, cualquier ruta que no sea `/auth/*` o `/share/*` redirige a `/auth/login`.
- Con sesión, entrar a `/auth/login`, `/auth/register` o `/auth/forgot-password` redirige a `/`. `/auth/reset-password` queda permitida porque el usuario llega ahí con una sesión de recuperación.
- Los archivos de imagen de `public/` quedan fuera del proxy.

---

## Cálculo de precios

Toda la lógica vive en `src/lib/pricing.ts` y se comparte entre el hook, el acordeón y la página `/share`:

- `unitPriceWithInflation(price, inflation)`: precio unitario **redondeado a entero**.
- `lineSubtotal(price, quantity, inflation)`: `cantidad × precio unitario redondeado`.

Como el redondeo se hace una sola vez por unidad, cada línea del documento suma exacto al total, y el total del footer, el de cada categoría y el del documento compartido coinciden siempre.

En `/share`, el total que se muestra es `budget.total`, guardado al momento de compartir. Es la fuente de verdad del presupuesto congelado. La fecha de emisión sale de `budget.created_at` (zona `America/Argentina/Buenos_Aires`), no de la fecha de apertura del link.

---

## Arquitectura (a alto nivel)

```
┌─────────────────────────────┐
│   Interfaz (Next.js/React)  │   Lo que ve y toca el usuario
├─────────────────────────────┤
│   Lógica de negocio (hooks) │   Cálculos, validaciones, estado
├─────────────────────────────┤
│   Base de datos (Supabase)  │   Catálogo, usuarios, presupuestos
└─────────────────────────────┘
```

Cada capa se puede modificar de forma independiente: se puede rediseñar la interfaz sin tocar los cálculos, o agregar reglas de negocio sin reescribir las pantallas.

### Estructura de carpetas (resumen)

```
src/
├── app/
│   ├── auth/            # login, register, forgot/reset-password, useAuth
│   ├── budget/components/  # Presupuestador, FormularioCliente, AccordionCategory, BudgetActions
│   ├── share/[id]/      # página pública del presupuesto + PrintTrigger
│   └── __tests__/       # tests con Vitest + Testing Library
├── hooks/usePresupuesto.ts
├── lib/                 # supabase (cliente), supabase-server, pricing
├── schema/validations.ts  # esquemas Zod
├── constants.ts
└── proxy.ts             # protección de rutas
```

---

## Tecnologías utilizadas

| Tecnología                     | Para qué se usa                                    |
| ------------------------------ | -------------------------------------------------- |
| **Next.js 16** (App Router)    | Framework principal, con React Compiler habilitado |
| **React 19**                   | Interfaz interactiva                               |
| **TypeScript**                 | Tipado estricto                                    |
| **Supabase** (`@supabase/ssr`) | Base de datos PostgreSQL, autenticación y RLS      |
| **Tailwind CSS 4**             | Estilos                                            |
| **React Hook Form + Zod**      | Formularios con validación                         |
| **Lucide React**               | Íconos                                             |
| **Vitest + Testing Library**   | Tests                                              |

---

## Base de datos (tablas usadas)

| Tabla          | Contenido                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| `items`        | Catálogo de materiales (con relación a `categories`)                                                            |
| `categories`   | Categorías del catálogo                                                                                         |
| `profiles`     | Datos del profesional (se crea por trigger `on_auth_user_created`)                                              |
| `draft`        | Borrador por usuario (`inflation`, `amounts`, `client_data`)                                                    |
| `budget`       | Cabecera del presupuesto compartido (cliente, validez, inflación, `total`, datos del profesional, `created_at`) |
| `budget_items` | Líneas del presupuesto, con snapshot de precio, nombre y categoría                                              |

`budget.created_at` debe existir como `timestamptz not null default now()`:

```sql
alter table budget
  add column if not exists created_at timestamptz not null default now();
```

Los presupuestos y borradores están protegidos por RLS: cada usuario solo accede a lo suyo. La lectura pública de `/share/[id]` depende de la política de lectura configurada para `budget` y `budget_items`.

---

## Configuración

Variables de entorno (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

En Supabase (**Authentication → URL Configuration → Redirect URLs**) hay que agregar las URLs de recuperación de contraseña, por ejemplo:

- `http://localhost:3000/auth/reset-password`
- `https://<tu-dominio>/auth/reset-password`

Si no están en la lista, Supabase ignora el `redirectTo` y manda al Site URL.

### Scripts

```bash
npm run dev         # desarrollo (expuesto en 0.0.0.0)
npm run build       # build de producción
npm run start       # servir el build
npm run lint        # ESLint
npm run test        # Vitest (una pasada)
npm run test:watch  # Vitest en modo watch
```

---

## Mejoras recientes

- **Persistencia en la nube** en lugar de `localStorage`: el progreso se guarda por usuario y sigue entre dispositivos.
- **Guardado con debounce** para reducir operaciones contra la base.
- **Seguridad por usuario** a nivel de base de datos (RLS).
- **Protección de rutas corregida**: `/auth/*` y `/share/*` son públicas, el resto requiere sesión, y el redirect apunta a `/auth/login`.
- **Flujo de auth consistente**: el registro cierra la sesión y lleva a `/auth/login?registered=1`; la recuperación de contraseña apunta a `/auth/reset-password`, que ahora es un Client Component.
- **Fecha de emisión estable** en `/share`, basada en `created_at`.
- **Cálculo de totales unificado** con `src/lib/pricing.ts` (redondeo del precio unitario), de modo que líneas, categorías, footer y documento compartido siempre coinciden, y `budget.total` es la fuente de verdad del presupuesto congelado.
- **Tests automatizados** del hook `usePresupuesto` y del formulario de cliente.

---

## Pendientes conocidos

- Revisar los imports y mocks de `src/app/__tests__/usePresupuesto.test.tsx` (el hook vive en `src/hooks/` y el cliente de Supabase en `@/lib/supabase`).
- Agregar un test del clamp en 0 de `adjustQuantity` partiendo de cantidad 0, y uno del redondeo por unidad con inflación.
- `DEFAULT_CLIENT.validity` se calcula al cargar el módulo; si la pestaña queda abierta varios días, la fecha por defecto queda vieja.
- Botones `+` / `-` de `AccordionCategory` sin `type="button"`.
- Presupuestos guardados antes de unificar el redondeo pueden diferir unos pesos entre `budget.total` y la suma de sus líneas.

---

# Roadmap

## Fase 1: Autenticación y Base

- [x] Configuración inicial del proyecto (Next.js App Router + Supabase).
- [x] Pantallas de Registro y Inicio de Sesión.
- [x] Flujo de recuperación y restablecimiento de contraseña.
- [x] Protección de rutas y layout global.

## Fase 2: Gestión de Materiales (el núcleo del sistema)

- [ ] Tabla de materiales con categorías (Cables, Protecciones, Tableros, Cañerías, etc.) administrable desde la app.
- [ ] Panel web para listar, buscar, filtrar y editar insumos manualmente.
- [ ] Gestión de unidades de medida (metro, unidad, rollo, caja).

## Fase 3: Automatización de Precios (lector de PDFs de proveedores)

- [ ] Carga y almacenamiento de PDFs enviados por ferreterías.
- [ ] Extracción de datos del catálogo del proveedor.
- [ ] Panel de auditoría de aumentos (precios viejos vs. nuevos).
- [ ] Actualización masiva de precios con un solo clic.

## Fase 4: Motor de Presupuestos

- [x] Selección de materiales y cálculo automático de totales con ajuste por inflación.
- [x] Snapshot de precios al compartir.
- [ ] Márgenes de ganancia configurables.
- [ ] Plantillas prearmadas por tipo de instalación (departamento, local comercial, tablero).

## Fase 5: Presentación y Entrega al Cliente

- [x] Documento público con diseño profesional, imprimible / guardable como PDF desde el navegador.
- [x] Datos del profesional (nombre, empresa, matrícula) en el encabezado.
- [ ] Logo personalizado del profesional.
- [ ] Envío directo por WhatsApp con mensaje prearmado.
- [ ] Historial de presupuestos por cliente y seguimiento de estados de obra.

---

## Ideas a futuro

### Técnicas

- Historial de presupuestos: ver y reabrir los ya compartidos.
- Edición de presupuestos compartidos generando una nueva versión sin perder la anterior.
- Notificaciones cuando un cliente abre el link.
- Mayor cobertura de tests (auth, `/share`, proxy).

### De negocio

- Firma o aceptación digital del cliente desde el mismo link.
- Estadísticas: presupuestos enviados, aceptados, ticket promedio.
- Multi-usuario por cuenta (equipo con catálogo compartido).
- Catálogo de precios dinámico por proveedor o zona geográfica.

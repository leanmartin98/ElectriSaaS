# Presupuestador

Herramienta web para armar, ajustar y compartir presupuestos de obras eléctricas de forma rápida y profesional.

---

## ¿Qué problema resuelve?

Armar un presupuesto a mano (Excel, Word, papel) es lento y propenso a errores: hay que buscar precios, sumar a mano, ajustar por inflación y después pasarlo en limpio para mandárselo al cliente. Presupuestador automatiza todo ese proceso:

1. Elegís los materiales y servicios de un catálogo
2. El sistema calcula el total automáticamente, con un ajuste por inflación configurable
3. Cargás los datos del cliente
4. Generás un link público con el presupuesto listo para compartir o descargar en PDF

---

## Cómo se usa, de principio a fin

### 1. Armar el presupuesto

El usuario ve un catálogo de materiales agrupado por categorías (cables, llaves, tableros, etc.). Cada categoría se puede expandir y colapsar. Dentro de cada una, con botones de `+` y `-` se elige la cantidad de cada item.

### 2. Ajustar por inflación

Un control deslizante permite aplicar un porcentaje de ajuste sobre todos los precios al mismo tiempo, para reflejar variaciones de costos sin tener que editar cada precio a mano.

### 3. Completar los datos del cliente

Un formulario aparte pide nombre, teléfono, dirección y fecha de validez del presupuesto. Tiene validaciones automáticas (por ejemplo, que el teléfono tenga formato correcto) y mensajes de error claros.

### 4. Guardado automático

A medida que el usuario trabaja, el progreso se guarda solo, en segundo plano, asociado a su cuenta. Si cierra la pestaña, cambia de computadora o vuelve más tarde, todo sigue exactamente donde lo dejó.

### 5. Compartir o descargar

Con un click se genera un link público único. Ese link muestra el presupuesto con diseño profesional, listo para:

- Enviarlo por WhatsApp o email
- Imprimirlo o guardarlo como PDF directamente desde el navegador

Una vez compartido, el presupuesto queda "congelado": aunque después se actualicen los precios del catálogo, el documento ya enviado no cambia. Esto evita inconsistencias con presupuestos que el cliente ya recibió.

---

## Arquitectura (a alto nivel)

La aplicación está dividida en tres capas:

```
┌─────────────────────────────┐
│   Interfaz (Next.js/React)  │   Lo que ve y toca el usuario
├─────────────────────────────┤
│   Lógica de negocio (hooks) │   Cálculos, validaciones, estado
├─────────────────────────────┤
│   Base de datos (Supabase)  │   Catálogo, usuarios, presupuestos
└─────────────────────────────┘
```

**Por qué esta separación importa para el negocio:** cada capa se puede modificar de forma independiente. Se puede rediseñar la interfaz sin tocar los cálculos de precios, o agregar nuevas reglas de negocio sin reescribir las pantallas. Esto reduce el costo y el riesgo de futuros cambios.

---

## Tecnologías utilizadas

| Tecnología                | Para qué se usa                                                            |
| ------------------------- | -------------------------------------------------------------------------- |
| **Next.js**               | Framework principal de la aplicación web                                   |
| **React**                 | Construcción de la interfaz interactiva                                    |
| **TypeScript**            | Tipado del código, para detectar errores antes de que lleguen a producción |
| **Supabase**              | Base de datos, autenticación de usuarios y almacenamiento en la nube       |
| **Tailwind CSS**          | Estilos visuales de la aplicación                                          |
| **React Hook Form + Zod** | Formularios con validación automática de datos                             |

---

## Mejoras recientes (técnicas)

### Persistencia en la nube en lugar de almacenamiento local

**Antes:** el progreso del presupuesto se guardaba únicamente en el navegador (`localStorage`). Esto significaba que si el usuario cambiaba de computadora, usaba el modo incógnito, o simplemente limpiaba el navegador, perdía todo su trabajo.

**Ahora:** el progreso se guarda en la base de datos, asociado a la cuenta del usuario. Esto permite:

- Continuar el trabajo desde cualquier dispositivo
- No perder información por errores del navegador
- Sentar las bases para futuras funcionalidades como historial de borradores o trabajo en equipo

### Guardado eficiente (debounce)

En lugar de guardar cada cambio individual al instante (lo que generaría una cantidad innecesaria de operaciones contra la base de datos), el sistema espera a una breve pausa en la actividad del usuario antes de guardar. Esto reduce la carga del sistema sin afectar la experiencia del usuario.

### Seguridad de datos por usuario

Cada usuario solo puede ver y modificar su propia información. Esto se garantiza a nivel de base de datos (no solo en la interfaz), por lo que ningún usuario puede acceder a los presupuestos o borradores de otro, ni siquiera intentando manipular la aplicación directamente.

### Corrección de cálculo de totales

Se identificó y corrigió una inconsistencia donde el total mostrado en el documento público no reflejaba correctamente el ajuste por inflación aplicado, lo cual podía generar diferencias entre lo presupuestado y lo cobrado.

---

## Oportunidades de mejora futuras

### A nivel técnico

- **Historial de presupuestos**: permitir ver y reabrir presupuestos compartidos anteriormente, no solo el borrador actual
- **Edición de presupuestos ya compartidos**: generar una nueva versión sin perder la anterior
- **Notificaciones**: avisar al usuario cuando un cliente abre el link del presupuesto
- **Optimización de imágenes y carga**: mejorar tiempos de carga en conexiones lentas
- **Tests automatizados**: cobertura de pruebas para evitar regresiones al agregar funcionalidades

### A nivel de negocio

- **Plantillas de presupuesto**: distintos formatos según tipo de obra o cliente
- **Firma o aceptación digital del cliente**: que el cliente pueda aprobar el presupuesto desde el mismo link, dejando registro
- **Estadísticas**: cuántos presupuestos se enviaron, cuántos fueron aceptados, ticket promedio
- **Multi-usuario por cuenta**: que un equipo de trabajo comparta el mismo catálogo y vea los presupuestos de todos
- **Integración con WhatsApp Business**: envío automático del link al generar el presupuesto
- **Catálogo de precios dinámico**: actualización de precios por proveedor o por zona geográfica

# ⚡ ElectriSaaS - Roadmap del Proyecto

## Fase 1: Autenticación y Base (En proceso)

- [ ] Configuración inicial del proyecto (Next.js App Router + Supabase).
- [ ] Pantallas de Registro y Inicio de Sesión.
- [ ] Flujo completo de recuperación y restablecimiento de contraseña.
- [ ] Estructura de carpetas limpia y layout global.

## Fase 2: Gestión de Materiales (El núcleo del sistema)

- [ ] Creación de la tabla de materiales en la base de datos (`materials`).
- [ ] Definición de categorías (Cables, Protecciones, Tableros, Cañerías, etc.).
- [ ] Panel web para listar, buscar, filtrar y editar insumos manualmente.
- [ ] Gestión de unidades de medida (metro, unidad, rollo, caja).

## Fase 3: Automatización de Precios (Lector de PDFs de Proveedores)

- [ ] Módulo de carga y almacenamiento de PDFs enviados por ferreterías.
- [ ] Sistema de extracción de datos del catálogo del proveedor.
- [ ] Panel de auditoría de aumentos (comparativa visual de precios viejos vs. nuevos).
- [ ] Funcionalidad de actualización masiva de precios con un solo clic.

## Fase 4: Motor de Presupuestos

- [ ] Creación y asociación de materiales a los ítems del presupuesto.
- [ ] Cálculo automático de costos totales y aplicación de márgenes de ganancia.
- [ ] Plantillas prearmadas por tipo de instalación (ej: departamento, local comercial, tablero).

## Fase 5: Presentación y Entrega al Cliente

- [ ] Generador de presupuestos en formato PDF personalizado (con logo y datos del electricista).
- [ ] Integración de botón para envío directo por WhatsApp con mensaje prearmado.
- [ ] Historial de presupuestos por cliente y seguimiento de estados de obra.

---

## Estado actual del proyecto

La aplicación cuenta hoy con:

- Catálogo de materiales navegable por categorías
- Cálculo automático de totales con ajuste por inflación
- Formulario de datos de cliente con validación
- Autenticación de usuarios
- Guardado automático en la nube
- Generación de links públicos compartibles
- Descarga en PDF desde el navegador

Es una base funcional y estable, preparada para seguir creciendo en funcionalidades sin necesidad de rehacer lo ya construido.

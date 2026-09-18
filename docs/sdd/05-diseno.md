# Diseño técnico — Skill investigacion-web + reseña de construcción de skills

- Proyecto: `mcpy`
- Paso del flujo: `/pi:05-design`
- Fecha: 2026-09-17
- Origen: `docs/sdd/04-especificacion.md`

## 1. Componentes afectados

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `.agents/skills/investigacion-web/SKILL.md` | Auditar + pulir (no reescribir) |
| 2 | `.codex/agents/investigador.toml` | Verificar coherencia con la skill |
| 3 | `docs/resena-skills.md` | Nuevo: reseña del proceso de construir skills |
| 4 | `docs/sdd/05-diseno.md` | Este documento |

## 2. Contratos públicos

### 2.1 Contrato de la skill (`SKILL.md`)

- **Frontmatter**: `name` y `description` (una línea, accionable, indica cuándo usarla y cuándo no).
- **Secciones** (con comentarios HTML `<!-- ... -->` que explican su propósito):
  - Objetivo
  - Preparación del encargo (cuestionario)
  - Fuentes proporcionadas por el usuario
  - Proceso
  - Selección de fuentes
  - Evidencia y citas
  - Formato de salida
  - Límites y criterio de finalización
- **Salida**: informe con `## Resumen`, `## Hallazgos` (con citas), `## Recomendaciones` (opcional), `## Fuentes`, `## Brechas`.

### 2.2 Contrato del subagente (`investigador.toml`)

- `name = "investigador"`, `description` (identidad).
- `model = "gpt-5.6-luna"`, `model_reasoning_effort = "low"`, `sandbox_mode = "read-only"`.
- `developer_instructions`: aplica la skill `$investigacion-web`; solo lectura; usa Playwright solo si la página requiere JS.
- `[mcp_servers.playwright]`: `npx -y @playwright/mcp@latest --headless --isolated`.

### 2.3 Contrato de delegación (principal → subagente)

1. Principal completa el **cuestionario** (si falta).
2. Construye el **encargo** con encabezados: `Pregunta`, `Fuentes iniciales`, `Sugerencia o contexto`, `Fuentes adicionales`.
3. Subagente investiga y devuelve **informe con citas**.

## 3. Persistencia y migraciones

- No aplica (no hay base de datos ni esquema).
- `.atl/skill-registry.md` es **auto-generado** (se regenera con `/skill-registry:refresh`); no se edita a mano.

## 4. Estrategia de testing

1. **Checklist de auditoría**: aplicar criterios de `skill-creator` / `skill-improver` (frontmatter, descripción, triggers).
2. **Prueba funcional**: correr un encargo real de investigación web y verificar informe con citas.
3. **Test de reproducibilidad**: crear una skill "mínima" de ejemplo siguiendo la reseña.

## 5. Decisiones técnicas

- **D1** — La reseña vive en `docs/resena-skills.md` (una sola, con esta skill como ejemplo).
- **D2** — Mantener el formato actual de la skill (comentarios HTML) y documentar esas convenciones en la reseña. No migrar formato.
- **D3** — La skill queda canónica en `.agents/skills/…`; la reseña incluye una matriz de portabilidad (Pi / Codex / Claude / opencode-go). No duplicar archivos por agente ahora.
- **D4** — Mantener `investigador.toml` como está; solo verificar coherencia.
- **D5** — Validación = checklist + prueba real + test de reproducibilidad.
- **D6** — Decisiones rechazadas: reescribir la skill desde cero; crear copias por agente ahora.

## 6. Riesgos y tradeoffs

- **Formato HTML vs `skill-creator`**: el formato actual es auto-documentado pero no es el estándar de `skill-creator`. Tradeoff: claridad pedagógica vs estandarización. Se mitiga documentando la convención.
- **Portabilidad**: una misma skill no funciona igual en todos los agentes (cada uno tiene su mecanismo). Tradeoff: mantener un solo archivo canónico + documentar la adaptación, en vez de duplicar archivos.

## 7. Próximo paso

`/pi:06-tasks` — dividir en tareas chicas, ordenadas y verificables.

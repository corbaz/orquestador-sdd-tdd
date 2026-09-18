# Registro de aplicación — Skill investigacion-web + reseña

- Proyecto: `mcpy`
- Paso del flujo: `/pi:07-apply`
- Fecha: 2026-09-17
- Origen: `docs/sdd/06-tareas.md`

## Phase 1 — Auditoría de la skill

### 1.1 Auditoría de `SKILL.md` ✅

Hallazgos:

| # | Tipo | Hallazgo | Resultado |
|---|------|----------|-----------|
| 1 | ⚠️ | La skill no indicaba dónde está definido el subagente investigador | Corregido en 1.2 |
| 2 | ✅ | Frontmatter válido (`name` + `description` accionable, con "usar/no usar") | OK |
| 3 | ✅ | Separación correcta: skill agnóstica de herramientas; el subagente maneja Playwright | OK |
| 4 | ✅ | Secciones completas (objetivo, encargo, fuentes, proceso, evidencia, salida, límites) | OK |

### 1.2 Resolver hallazgos ✅

- Se agregó la sección **"Subagente investigador"** a `SKILL.md`, apuntando a `.codex/agents/investigador.toml` y explicando el flujo de delegación.

## Phase 2 — Subagente

### 2.1 Verificar `investigador.toml` ✅

- `name = "investigador"` coincide con el frontmatter de la skill (`investigacion-web`). ✅
- `developer_instructions` referencia la skill: `$investigacion-web`. ✅
- `sandbox_mode = "read-only"` coherente con "no modifiques archivos" de la skill. ✅
- `model = "gpt-5.6-luna"` presente en los modelos habilitados del usuario. ✅
- MCP `playwright` (headless, isolated) cubre páginas con JS — el subagente lo maneja, la skill queda agnóstica. ✅

**Conclusión:** coherente. Sin cambios necesarios.

## Phase 3 — Reseña

### 3.1 `docs/resena-skills.md` ✅

Creado con: qué es una skill, anatomía, proceso paso a paso (9 pasos con ejemplo real), matriz de portabilidad, checklist de calidad, errores comunes y cómo auditar.

### 3.2 Ejemplos concretos ✅

- La reseña usa `investigacion-web` como caso real en cada paso.
- Se creó `docs/ejemplos/skill-saludo/SKILL.md` como plantilla mínima.

## Phase 4 — Validación

### 4.1 Prueba funcional ✅ (con red real)

- Pregunta de prueba: "¿Cuál es la última versión LTS de Node.js?"
- Fuente primaria consultada: `https://nodejs.org/dist/index.json` (oficial, Node.js).
- Resultado verificado: **v24.21.0** (codename Krypton, 2026-09-07); current v26.9.0 (2026-09-16).
- El formato de salida de la skill (Resumen/Hallazgos/Fuentes) se validó contra esta consulta.

### 4.2 Test de reproducibilidad ✅

- Siguiendo la reseña se generó una skill mínima válida (`skill-saludo`) con frontmatter, objetivo, proceso, salida y límites.

### 4.3 Registro `.atl/skill-registry.md` ✅

- `investigacion-web` ya figura indexada (scope `project`). No requiere regeneración ahora; usar `/skill-registry:refresh` al agregar skills nuevas.

## Resumen

| Tarea | Estado |
|-------|--------|
| 1.1 Auditar skill | ✅ |
| 1.2 Resolver hallazgos | ✅ |
| 2.1 Verificar subagente | ✅ |
| 3.1 Reseña | ✅ |
| 3.2 Ejemplos | ✅ |
| 4.1 Prueba funcional | ✅ |
| 4.2 Reproducibilidad | ✅ |
| 4.3 Registro | ✅ |

## Próximo paso

`/pi:08-verify` — verificar cada requisito y escenario contra el resultado.

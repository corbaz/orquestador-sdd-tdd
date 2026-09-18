# Tareas SDD/TDD — Skill investigacion-web + reseña de construcción de skills

- Proyecto: `mcpy`
- Paso del flujo: `/pi:06-tasks`
- Fecha: 2026-09-17
- Origen: `docs/sdd/05-diseno.md`

## Decisiones de planificación

- **Orden**: auditoría → pulir skill → verificar subagente → reseña → validación.
- **Tamaño máx. de revisión**: tareas chicas (≈ ≤ 50 líneas de cambio cada una).
- **Método**: aplicación + verificación por tarea (checklist + prueba real + test de reproducibilidad). TDD de código no aplica (es documentación/skills).

## Phase 1 — Auditoría de la skill

- [ ] 1.1 Auditar `SKILL.md` (frontmatter, descripción, triggers, secciones) → lista de hallazgos.
- [ ] 1.2 Resolver hallazgos (corregir o justificar) → skill pulida.

## Phase 2 — Subagente

- [ ] 2.1 Verificar que `investigador.toml` carga y aplica la skill (ref `$investigacion-web`, instrucciones coherentes) → verificación documentada.

## Phase 3 — Reseña

- [ ] 3.1 Escribir `docs/resena-skills.md`: proceso paso a paso + matriz de portabilidad (Pi/Codex/Claude/opencode-go).
- [ ] 3.2 Añadir ejemplos concretos usando `investigacion-web` como caso real.

## Phase 4 — Validación

- [ ] 4.1 Prueba funcional: encargo real de investigación web → informe con citas.
- [ ] 4.2 Test de reproducibilidad: crear una skill mínima de ejemplo siguiendo la reseña.
- [ ] 4.3 Regenerar `.atl/skill-registry.md` si hace falta.

## Forecast

Cambio total ≈ 200–300 líneas (skill pulida + reseña + ejemplo). No supera 400 líneas → no requiere slices de revisión.

## Próximo paso

`/pi:07-apply` — aplicar las tareas en orden con verificación.

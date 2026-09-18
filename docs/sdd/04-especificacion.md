# Especificación SDD — Skill investigacion-web + reseña de construcción de skills

- Proyecto: `mcpy`
- Paso del flujo: `/pi:04-spec`
- Fecha: 2026-09-17
- Origen: `docs/sdd/03-propuesta.md`

## Requirement: R1 — Skill terminada

La skill `investigacion-web` MUST tener frontmatter válido (`name` + `description` clara y accionable).

La skill MUST definir comportamiento observable completo (encargo, proceso, fuentes, evidencia/citas, formato de salida, límites).

La skill MUST ser coherente con el subagente investigador (este puede cargarla y aplicarla).

La skill SHOULD ser portable entre agentes (Pi, Codex, Claude, opencode-go) sin quedar atada a un solo formato.

### Scenario: encargo incompleto

- Given: un usuario hace una pregunta de investigación sin encargo completo.
- When: invoca la skill.
- Then: el agente presenta el cuestionario (pregunta principal, fuentes, contexto, fuentes adicionales) y espera la respuesta.

### Scenario: informe con citas

- Given: el investigador recibe un encargo completo.
- When: ejecuta la investigación.
- Then: produce un informe con Resumen, Hallazgos citados, Fuentes y Brechas (si aplica), sin inventar fuentes.

### Scenario: subagente de solo lectura

- Given: el subagente investigador recibe una tarea.
- When: ejecuta sus instrucciones.
- Then: aplica la skill y devuelve un informe, sin modificar archivos ni sistemas externos.

## Requirement: R2 — Auditoría de calidad

La skill MUST pasar una auditoría con criterios de `skill-creator` / `skill-improver` (frontmatter, descripción, triggers).

Los hallazgos de la auditoría MUST resolverse (corregir o justificar).

### Scenario: auditoría resuelta

- Given: la skill existe.
- When: se aplican los criterios de `skill-creator` / `skill-improver`.
- Then: los hallazgos se resuelven y la skill queda validada.

## Requirement: R3 — Reseña documentada

El proyecto MUST incluir una documentación-reseña del proceso de construir skills.

La reseña MUST incluir explicaciones paso a paso y ejemplos concretos (usando esta skill como caso real).

La reseña MUST permitir que otro agente/persona repita el proceso.

La reseña SHOULD cubrir portabilidad multi-agente (diferencias de formato entre agentes).

### Scenario: reseña reproducible

- Given: una persona/agente quiere crear una skill nueva.
- When: sigue la reseña.
- Then: produce una skill con frontmatter válido y comportamiento documentado, siguiendo pasos y ejemplos.

## Requirement: R4 — Validación funcional

Se MUST correr un encargo real de investigación web con la skill y verificar que produce un informe con citas.

Se MUST verificar que el subagente investigador carga y aplica la skill.

### Scenario: validación funcional

- Given: la skill y el subagente investigador están terminados.
- When: se ejecuta un encargo real de investigación.
- Then: el resultado incluye un informe con citas verificables y el subagente aplica correctamente la skill.

## Próximo paso

`/pi:05-design` — definir arquitectura, componentes y estrategia de testing.

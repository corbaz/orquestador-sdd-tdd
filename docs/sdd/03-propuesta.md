# Propuesta SDD — Skill investigacion-web + reseña de construcción de skills

- Proyecto: `mcpy`
- Paso del flujo: `/pi:03-propose`
- Fecha: 2026-09-17

## 1. Problema

Existe una skill `investigacion-web` bastante avanzada y un subagente investigador, pero **no hay un proceso documentado y reproducible para construir skills** (con explicaciones y ejemplos). El conocimiento de "cómo se hace una skill" quedó implícito y disperso, y la propia skill no está cerrada ni validada contra las convenciones existentes (`skill-creator` / `skill-improver`). Sin una reseña reutilizable, cada skill futura se armaría "de cero" y con criterios inconsistentes.

## 2. Objetivo

Entregar dos cosas versionables:

1. La skill `investigacion-web` **terminada y validada**, coherente con su subagente investigador y con las convenciones de `skill-creator` / `skill-improver`, y **portable entre agentes** (Pi, Codex, Claude, opencode-go, etc.).
2. Una **documentación-reseña** del proceso de construir skills, con explicaciones paso a paso y **ejemplos concretos** (usando esta skill como caso real), para repetir el proceso en skills futuras.

**Requisito transversal:** todo el trabajo debe incluir explicaciones y ejemplos orientados a aprender, y quedar documentado como reseña reutilizable.

## 3. Alcance

- Skill `investigacion-web` terminada y validada (`SKILL.md`).
- Verificar/ajustar coherencia con el subagente investigador (`.codex/agents/investigador.toml`) y con `skill-creator` / `skill-improver`.
- Documentación-reseña del proceso de construir skills: explicaciones paso a paso + ejemplos.
- Considerar portabilidad entre agentes (Pi, Codex, Claude, opencode-go, etc.).

## 4. Fuera de alcance

- Mejorar el orquestador SDD/TDD (anotado en `docs/backlog.md`).
- Crear otras skills nuevas (solo se documenta el proceso; esta skill es el ejemplo).
- Tocar otros agentes/herramientas (Codex, ATL, graphify) más allá de lo que la skill necesite.

## 5. Riesgos

- **Rehacer en vez de auditar/pulir**: la skill ya está avanzada → auditar primero.
- **Formato interno** (comentarios HTML) puede no alinear 100% con `skill-creator` → convenciones inconsistentes.
- **Multi-agente**: cada agente tiene su propio formato de skills → riesgo de que quede "atada" a un solo agente. Documentar portabilidad.
- **Reseña "teórica"** sin ejemplos ejecutables → anclar a casos reales.

## 6. Plan de validación

- **Auditoría**: frontmatter, descripción y triggers correctos (criterios `skill-creator` / `skill-improver`).
- **Prueba real**: correr un encargo de investigación web con la skill y verificar informe con citas.
- **Subagente**: confirmar que `investigador.toml` carga y aplica la skill correctamente.
- **Reseña**: verificar que documenta el proceso con ejemplos, de forma que otro agente/persona pueda repetirlo.

## Próximo paso

`/pi:04-spec` — definir requisitos verificables y escenarios Given/When/Then.

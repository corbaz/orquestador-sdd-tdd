# Backlog de trabajo pendiente

## Skill busqueda (matriz de fuentes) — completado ✅

- **Estado**: ✅ creada e integrada.
- **Archivo**: `.agents/skills/busqueda/SKILL.md`.
- **Qué es**: matriz extensible de fuentes de búsqueda (OpenAlex, Crossref, arXiv, Semantic Scholar, PubMed, Context7, Microsoft Learn, GitHub, Stack Exchange, Wikipedia, Reddit).
- **Integración**: `investigacion-web` delega el paso "buscar" en esta skill; regla agregada: Reddit/foros solo como contexto.
- **Stack de investigación completo**: `busqueda` (buscar) → `curl` (leer estático) → `playwright-cli` (leer JS).

## Orquestador SDD/TDD — mejora aplicada ✅ (parcial)

- **Estado**: ✅ primera mejora — skills `sdd-apply`, `sdd-verify`, `sdd-review` agregadas (para `/pi:07-09`).
- **Pendiente para próximos ciclos**: skills 07/08/09 más detalladas, prompts/docs por paso, hooks de verificación automática, más comandos `99-*`.
- **Recordatorio**: en el repo del orquestador, `bun run check` antes de publicar.

## Skill playwright-cli (navegador para Pi) — completado ✅

- **Estado**: ✅ skill oficial instalada (Microsoft) + `references/`.
- **Archivo**: `.agents/skills/playwright-cli/` (SKILL.md + references/).

## Skill investigacion-web — ciclo completado ✅

- **Estado**: cerrado (flujo `/pi:01-init` → `/pi:09-review`), commit `a8f41a1`.
- **Entregables**: `SKILL.md` pulida, `docs/resena-skills.md`, `docs/ejemplos/skill-saludo/SKILL.md`, `docs/sdd/03…09`.

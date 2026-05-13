# Arquitectura

## Objetivo

El paquete organiza un flujo SDD/TDD completo en Pi mediante extension, comandos, hooks, skills, prompts y persistencia.

## Componentes

### Extension principal

`extensions/orchestrator.ts` registra los comandos:

- `/pi:01-init`
- `/pi:02-discover`
- `/pi:03-propose`
- `/pi:04-spec`
- `/pi:05-design`
- `/pi:06-tasks`
- `/pi:07-apply`
- `/pi:08-verify`
- `/pi:09-review`
- `/pi:99-doctor`
- `/pi:99-fix`
- `/pi:99-migrate`
- `/pi:99-report`
- `/pi:99-version`

Los comandos del flujo explican que hace cada paso y envian una guia visible al agente. Los comandos `/pi:99-*` quedan fuera del flujo numerado: diagnostican, preparan convenciones, generan evidencia o corrigen sin avanzar pasos SDD.

### Hooks

- `protect-secrets.ts`: bloquea secretos probables y comandos destructivos.
- `capture-session.ts`: captura eventos simples de inicio y fin.
- `compact-context.ts`: guarda un placeholder de resumen antes de compactar contexto.
- `validate-workflow-step.ts`: valida el orden de comandos `/pi:*` cuando hay metadata local.

### Persistencia

`extensions/lib/paths.ts` define rutas globales y locales.

`extensions/lib/persistence.ts` centraliza:

- Creacion de estado local y SQLite
- Mantenimiento seguro de `.gitignore`
- Diagnostico, migracion, coherencia SDD, reportes y correcciones
- `runProjectDoctor()` reporta hallazgos, correcciones aplicadas, artefactos SDD esperados segun los pasos completados y coherencia entre fases
- SQLite se activa automaticamente al inicializar un proyecto

### Skills y prompts

Los skills dan instrucciones operativas por fase. Los prompts numerados ofrecen entradas reutilizables para cada comando.

## Decisiones

### Flujo principal

- `/pi:01-*` a `/pi:08-*`: pasos ordenados del ciclo SDD/TDD.
- `/pi:09-*`: cierre de ciclo.
- No se pueden saltar pasos. El hook `validate-workflow-step` bloquea pasos adelantados.

### Comandos auxiliares

- `/pi:99-*`: reservados para diagnostico, migracion, mantenimiento, reportes, correcciones y soporte.
- No avanzan metadata del flujo.

### Produccion minima

- Paquete versionado.
- Tests locales (package, doctor/migracion, workflow, coherencia).
- CI remoto.
- Documentacion de uso y criterio de produccion.
- SQLite persistente por defecto.

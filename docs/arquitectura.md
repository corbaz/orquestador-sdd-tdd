# Arquitectura

## Objetivo

El paquete organiza un flujo SDD/TDD en Pi mediante extension, comandos, hooks, skills, prompts y persistencia minima.

## Componentes

### Extension principal

`extensions/orchestrator.ts` registra los comandos:

- `/pi:01-init`
- `/pi:02-discover`
- `/pi:03-propose`
- `/pi:04-spec`
- `/pi:05-design`
- `/pi:06-tasks`
- `/pi:99-doctor`

Cada comando del flujo explica que hace, cual es el proximo paso y envia una guia visible para orientar al agente. `/pi:99-doctor` queda fuera del flujo numerado: diagnostica el proyecto actual y aplica mantenimiento seguro sin avanzar pasos SDD.

### Hooks

- `protect-secrets.ts`: bloquea secretos probables y comandos destructivos.
- `capture-session.ts`: captura eventos simples de inicio y fin.
- `compact-context.ts`: guarda un placeholder de resumen antes de compactar contexto.
- `validate-workflow-step.ts`: valida el orden de comandos `/pi:*` cuando hay metadata local.

### Persistencia

`extensions/lib/paths.ts` define rutas globales y locales.

`extensions/lib/persistence.ts` crea SQL inicial, metadata JSON y placeholders `.sqlite`; el adapter SQLite real queda fuera de MVP1 para no exigir una dependencia nativa.

En MVP2 tambien centraliza mantenimiento seguro de `.gitignore` para estado local del orquestador y ruido comun del sistema operativo.

`runProjectDoctor()` reporta hallazgos, correcciones aplicadas, artefactos SDD esperados segun los pasos completados y coherencia basica entre propuesta, especificacion, diseno y tareas. No crea documentos SDD ni avanza metadata.

### Skills y prompts

Los skills dan instrucciones operativas por fase. Los prompts numerados ofrecen entradas reutilizables para cada comando.

## Decision MVP1

La automatizacion profunda queda fuera. El valor principal es imponer una secuencia sana: entender, proponer, especificar, disenar, partir tareas y recien despues aplicar.

## Decision MVP2

Los comandos auxiliares usan la familia `/pi:99-*`. Esto deja espacio para que el flujo principal crezca con comandos `/pi:01-*` a `/pi:98-*` sin mezclar mantenimiento con avance de etapas.

# orquestador-sdd-tdd

Paquete global de Pi para guiar proyectos con SDD y TDD paso a paso.

Version actual: `1.2.0` con CI remoto.

[![CI](https://github.com/corbaz/orquestador-sdd-tdd/actions/workflows/ci.yml/badge.svg)](https://github.com/corbaz/orquestador-sdd-tdd/actions/workflows/ci.yml)

## Objetivo

Mantener Pi limpio y agregar un orquestador global reutilizable en cualquier carpeta. El paquete carga comandos, skills y hooks; cada proyecto guarda solo su estado local.

Los prompts numerados quedan en `prompts/` como referencia interna del repo, pero no se registran como slash commands para evitar duplicar `/01-init` con `/pi:01-init`.

## Instalacion

Con Pi instalado, instalar desde GitHub:

```bash
pi install git:github.com/corbaz/orquestador-sdd-tdd
```

Para probar localmente desde este repo:

```bash
pi install git:file:///C:/Compartido/pi
```

## Desarrollo local

Este repo usa Bun para comandos de desarrollo:

```bash
bun run check
```

No hace falta publicar con npm para usarlo con Pi. El mecanismo de uso es `pi install`.

## Flujo completo

```text
/pi:01-init      → Inicializar proyecto
/pi:02-discover  → Relevar estado actual
/pi:03-propose   → Redactar propuesta
/pi:04-spec      → Especificar requisitos
/pi:05-design    → Disenar arquitectura
/pi:06-tasks     → Planificar tareas
/pi:07-apply     → Aplicar con TDD
/pi:08-verify    → Verificar contra spec
/pi:09-review    → Cerrar ciclo
```

## Comandos auxiliares

```text
/pi:99-doctor    → Diagnosticar y mantener
/pi:99-migrate   → Preparar convenciones
/pi:99-report    → Generar evidencia
/pi:99-fix       → Auto-corregir hallazgos
```

`/pi:99-doctor` revisa el proyecto actual, no avanza pasos SDD y aplica solo mantenimiento seguro del orquestador. Por ahora asegura entradas locales de `.gitignore` para `.pi/` y `.DS_Store`, y reporta metadata y artefactos SDD esperados.

`/pi:99-migrate` prepara convenciones versionables seguras: `docs/sdd/`, bloque gestionado en `AGENTS.md` e ignores locales.

`/pi:99-report` genera `docs/sdd/99-reporte-validacion.md` con estado final `apto`, `revisar` o `bloqueado`.

Convencion: los comandos `/pi:99-*` son auxiliares. El flujo principal queda reservado para `/pi:01-*` a `/pi:98-*`.

Ver tambien `docs/mantenimiento.md`.

Produccion minima del orquestador se valida con `bun run check` en este repo y `/pi:99-doctor` sin errores en el proyecto objetivo.

Ver tambien `docs/produccion.md`.

## Persistencia

Global:

```text
~/.pi/agent/orquestador-sdd-tdd/orchestrator.sqlite
```

Local por proyecto:

```text
<project>/.pi/orquestador-sdd-tdd/project.sqlite
```

SQLite esta disponible como adapter opcional. `openProjectDatabase()` y `initProjectDatabase()` en `extensions/lib/persistence.ts` habilitan persistencia real cuando el proyecto lo requiere.

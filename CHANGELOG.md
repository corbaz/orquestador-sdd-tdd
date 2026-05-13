# Changelog

## 1.2.0 - CI remoto

Agrega validacion automatica en GitHub para cada push y PR.

### Incluye

- Workflow CI en `.github/workflows/ci.yml`.
- Ejecuta `bun install` y `bun run check` en cada push a `main` y PR contra `main`.
- Corre con Ubuntu latest y Bun `1.3.13`.

## 1.1.0 - Reportes versionables

Agrega evidencia versionable para revisiones tecnicas o direccion.

### Incluye

- Nuevo comando `/pi:99-report`.
- Generacion de `docs/sdd/99-reporte-validacion.md`.
- Estado final `apto`, `revisar` o `bloqueado` basado en hallazgos del doctor.
- Tests para reportes aptos y bloqueados.

## 1.0.0 - Produccion minima

Primera version lista para uso controlado del orquestador SDD/TDD en Pi.

### Incluye

- Flujo principal `/pi:01-init` a `/pi:06-tasks`.
- Comandos auxiliares `/pi:99-doctor` y `/pi:99-migrate`.
- Estado local por proyecto en `.pi/orquestador-sdd-tdd/`.
- Artefactos SDD versionables esperados en `docs/sdd/`.
- Mantenimiento seguro de `.gitignore` para `.pi/` y `.DS_Store`.
- Bloque gestionado en `AGENTS.md` sin borrar contenido existente.
- Validacion de coherencia entre propuesta, especificacion, diseno y tareas.
- Tests locales para package, doctor/migracion y workflow.

### Validacion

```bash
bun run check
```

### Fuera de alcance

- SQLite real como adapter activo.
- CI remoto obligatorio.
- Migraciones destructivas.
- Creacion automatica de artefactos SDD faltantes.

# Changelog

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

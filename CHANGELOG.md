# Changelog

## 1.6.2 - Version auto-validation

`bun run check` ahora valida que `package.json` coincida con el ultimo tag de Git.

### Incluye
- Nuevo script `scripts/check-version.ts`.
- Incluido en `bun run check`.
- Previene el bug de version desync entre package.json y tag.

## 1.6.1 - Compatibilidad cross-runtime (fix version)

SQLite ahora es opcional segun el runtime. La extension carga correctamente en cualquier runtime que use Pi.

- Fix: `bun:sqlite` importado condicionalmente para no romper en runtimes no-Bun.
- Bun bump a `1.3.14`.

SQLite ahora es opcional segun el runtime. La extension carga correctamente en cualquier runtime que use Pi.

- Fix: `bun:sqlite` importado condicionalmente para no romper en runtimes no-Bun.
- Bun bump a `1.3.14`.

## 1.6.0 - Manual de usuario y version

Documentacion completa para usuarios finales y comando de version.

### Incluye

- README completo como manual de usuario con casos nuevo/existente.
- Comando `/pi:99-version` para conocer la version instalada.
- AGENTS.md, docs/flujo-de-trabajo.md y docs/arquitectura.md actualizados.
- Guia paso a paso para principiantes.

## 1.5.0 - Orquestador completo

Ciclo SDD/TDD completo desde init hasta cierre.

### Incluye

- Flujo completo `/pi:01-init` a `/pi:09-review`.
  - `/pi:07-apply` → aplicar tareas con TDD
  - `/pi:08-verify` → verificar contra especificacion
  - `/pi:09-review` → cerrar ciclo
- Comando `/pi:99-fix` para auto-correccion guiada de artefactos faltantes.
- SQLite real como adapter opcional via `initProjectDatabase()`.
- Tests actualizados para workflow de 9 pasos.

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

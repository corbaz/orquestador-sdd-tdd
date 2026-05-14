<!-- orquestador-sdd-tdd:start -->
## orquestador-sdd-tdd

- Usar el flujo `/pi:01-init` a `/pi:06-tasks` para cambios SDD/TDD.
- Usar `/pi:99-doctor` para diagnostico, mantenimiento seguro y coherencia entre fases.
- Guardar artefactos SDD versionables en `docs/sdd/`.
- No editar manualmente `.pi/orquestador-sdd-tdd/` salvo mantenimiento deliberado.
- Ejecutar `bun run check` en el repo del orquestador antes de publicar cambios del package.
<!-- orquestador-sdd-tdd:end -->

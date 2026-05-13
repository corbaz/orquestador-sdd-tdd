# Produccion minima

El orquestador esta listo para uso controlado cuando el paquete pasa sus checks locales y el proyecto objetivo no presenta errores en `/pi:99-doctor`.

## Camino rapido

En el repo del orquestador:

```bash
bun run check
```

En el proyecto objetivo:

```text
/pi:99-migrate
/pi:99-doctor
```

Resultado esperado:

- `bun run check` termina sin errores.
- `/pi:99-doctor` no reporta issues `ERROR`.
- Los artefactos SDD requeridos por los pasos completados existen.
- Los requisitos `MUST` aparecen cubiertos en diseno y tareas.
- No hay temas fuera de alcance reintroducidos como trabajo activo.

## Que cubre

| Area | Validacion |
| --- | --- |
| Instalacion | El package builda y declara comandos esperados. |
| Mantenimiento | `.pi/` y `.DS_Store` quedan ignorados en Git. |
| Migracion | `AGENTS.md` conserva contenido existente y contiene un bloque del orquestador. |
| Flujo | Metadata conserva pasos completados y paso actual. |
| Artefactos | `docs/sdd/` se revisa segun el avance real del flujo. |
| Coherencia | Requisitos `MUST` deben aparecer en diseno y tareas. |
| Alcance | Temas fuera de alcance no deben reaparecer como implementacion activa. |

## Que no cubre todavia

- No ejecuta una aplicacion productiva del usuario.
- No crea documentos faltantes automaticamente.
- No hace migraciones destructivas.
- No reemplaza revision humana.
- No activa SQLite real; SQLite sigue preparado como schema/ruta placeholder.

## Criterio para avanzar

Si `/pi:99-doctor` reporta `WARNING`, se puede seguir con cuidado si el equipo acepta el riesgo.

Si reporta `ERROR`, primero hay que corregir el conflicto logico o ajustar los artefactos SDD.

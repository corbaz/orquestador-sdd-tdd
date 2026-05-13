# Mantenimiento MVP2

`/pi:99-doctor` diagnostica el proyecto actual y aplica solo correcciones locales seguras. No avanza el flujo SDD/TDD y no reemplaza `/pi:01-init` a `/pi:06-tasks`.

## Camino rapido

1. Actualizar la herramienta global si hace falta:

```bash
pi update git:github.com/corbaz/orquestador-sdd-tdd
```

2. Entrar al proyecto que queres revisar:

```bash
cd <tu-proyecto>
pi --no-skills
```

3. Ejecutar el doctor dentro de Pi:

```text
/pi:99-doctor
```

Para preparar convenciones versionables del proyecto:

```text
/pi:99-migrate
```

## Contrato

| Tema | Decision |
| --- | --- |
| Familia de comandos | `/pi:99-*` queda reservada para diagnostico, migracion, mantenimiento y soporte. |
| Flujo SDD | `/pi:99-doctor` no modifica `currentStep` ni agrega pasos completados. |
| Git | Si detecta un repo Git, asegura ignores seguros en `.gitignore`. |
| Correcciones actuales | Agrega `.pi/` y `.DS_Store` si faltan. |
| Artefactos SDD | Revisa `docs/sdd/` segun los pasos completados en metadata. |
| Coherencia SDD | Verifica referencias entre fases, cobertura de requisitos `MUST` y conflictos conservadores con fuera de alcance. |
| Migracion | `/pi:99-migrate` crea `docs/sdd/` y agrega un bloque gestionado en `AGENTS.md` sin borrar contenido existente. |
| Seguridad | No modifica codigo productivo ni crea artefactos SDD faltantes automaticamente. |

## Hallazgos posibles

| Codigo | Significado |
| --- | --- |
| `git-not-detected` | No se encontro un repositorio Git, por lo tanto no se toca `.gitignore`. |
| `gitignore-entry-added` | Se agrego una entrada segura a `.gitignore`. |
| `metadata-missing` | El proyecto todavia no tiene metadata del orquestador. |
| `sdd-artifact-missing` | Un paso figura como completado, pero falta su artefacto SDD esperado. |
| `sdd-reference-missing` | Un documento no referencia el artefacto anterior esperado. |
| `sdd-design-coverage-missing` | Un requisito `MUST` no aparece en el diseno. |
| `sdd-task-coverage-missing` | Un requisito `MUST` no aparece en las tareas. |
| `sdd-out-of-scope-conflict` | Un tema marcado fuera de alcance reaparece como trabajo activo. |

## Update vs doctor

`pi update git:github.com/corbaz/orquestador-sdd-tdd` actualiza la herramienta instalada globalmente.

`/pi:99-doctor` revisa y corrige solo el proyecto actual donde lo ejecutas.

Esto evita que una actualizacion global modifique proyectos sin permiso.

## Criterio de produccion minima

El orquestador queda listo para uso controlado cuando:

- `bun run check` pasa en el repo principal.
- `/pi:99-doctor` no reporta errores en el proyecto actual.
- Los pasos completados tienen sus artefactos SDD esperados.
- Los requisitos `MUST` aparecen cubiertos por diseno y tareas.
- No hay temas fuera de alcance reintroducidos como trabajo activo.

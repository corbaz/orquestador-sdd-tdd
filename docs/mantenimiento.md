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

## Contrato

| Tema | Decision |
| --- | --- |
| Familia de comandos | `/pi:99-*` queda reservada para diagnostico, migracion, mantenimiento y soporte. |
| Flujo SDD | `/pi:99-doctor` no modifica `currentStep` ni agrega pasos completados. |
| Git | Si detecta un repo Git, asegura ignores seguros en `.gitignore`. |
| Correcciones actuales | Agrega `.pi/` y `.DS_Store` si faltan. |
| Artefactos SDD | Revisa `docs/sdd/` segun los pasos completados en metadata. |
| Seguridad | No modifica codigo productivo ni crea artefactos SDD faltantes automaticamente. |

## Hallazgos posibles

| Codigo | Significado |
| --- | --- |
| `git-not-detected` | No se encontro un repositorio Git, por lo tanto no se toca `.gitignore`. |
| `gitignore-entry-added` | Se agrego una entrada segura a `.gitignore`. |
| `metadata-missing` | El proyecto todavia no tiene metadata del orquestador. |
| `sdd-artifact-missing` | Un paso figura como completado, pero falta su artefacto SDD esperado. |

## Update vs doctor

`pi update git:github.com/corbaz/orquestador-sdd-tdd` actualiza la herramienta instalada globalmente.

`/pi:99-doctor` revisa y corrige solo el proyecto actual donde lo ejecutas.

Esto evita que una actualizacion global modifique proyectos sin permiso.

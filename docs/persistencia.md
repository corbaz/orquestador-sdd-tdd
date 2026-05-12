# Persistencia

## Rutas

Global:

```text
~/.pi/agent/orquestador-sdd-tdd/orchestrator.sqlite
```

Local por proyecto:

```text
<project>/.pi/orquestador-sdd-tdd/project.sqlite
```

Metadata local:

```text
<project>/.pi/orquestador-sdd-tdd/metadata.json
```

SQL generado:

```text
~/.pi/agent/orquestador-sdd-tdd/schema.sql
<project>/.pi/orquestador-sdd-tdd/schema.sql
```

## Contrato MVP1

El helper `ensurePersistenceFiles()` crea directorios, placeholders `.sqlite`, SQL inicial y metadata local. No abre SQLite directamente: en MVP1 no hay adapter SQLite real para evitar sumar una dependencia nativa.

## Schema inicial

El SQL incluye:

- `workflow_events`: eventos por paso.
- `workflow_state`: estado por proyecto.
- `session_snapshots`: resumenes de sesion.

## Evolucion esperada

En MVP2 se puede conectar un adapter SQLite real que ejecute `schema.sql` contra las rutas estables. El contrato de rutas no deberia cambiar.

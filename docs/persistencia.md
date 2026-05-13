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

## SQLite adapter

SQLite esta disponible como adapter opcional. Los archivos `.sqlite` se crean como placeholders por `ensurePersistenceFiles()`. Para activar persistencia real:

```ts
import { initProjectDatabase } from "../extensions/lib/persistence.ts";

const db = initProjectDatabase(projectRoot);
db.run("INSERT INTO workflow_events (project_root, step, event_type) VALUES (?, ?, ?)", [projectRoot, "01-init", "applied"]);
```

`openProjectDatabase()` devuelve `null` si el archivo `.sqlite` esta vacio o no existe; `initProjectDatabase()` crea o fuerza la base de datos y ejecuta el schema SQL.

## Schema inicial

El SQL incluye:

- `workflow_events`: eventos por paso.
- `workflow_state`: estado por proyecto.
- `session_snapshots`: resumenes de sesion.

## Evolucion esperada

En MVP2 se puede conectar un adapter SQLite real que ejecute `schema.sql` contra las rutas estables. El contrato de rutas no deberia cambiar.

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

SQLite se activa automaticamente al inicializar un proyecto. `ensurePersistenceFiles()` crea e inicializa la base de datos con el schema SQL. Para acceder a la base de datos:

```ts
import { openProjectDatabase, openGlobalDatabase } from "../extensions/lib/persistence.ts";

const db = openProjectDatabase(projectRoot);
db.run("INSERT INTO workflow_events (project_root, step, event_type) VALUES (?, ?, ?)", [projectRoot, "01-init", "applied"]);
const rows = db.query("SELECT * FROM workflow_events").all();

// Para cerrar la conexion:
db.close();
```

`openGlobalDatabase()` ofrece acceso a la base de datos global.

## Schema inicial

El SQL incluye:

- `workflow_events`: eventos por paso.
- `workflow_state`: estado por proyecto.
- `session_snapshots`: resumenes de sesion.

## Evolucion esperada

En MVP2 se puede conectar un adapter SQLite real que ejecute `schema.sql` contra las rutas estables. El contrato de rutas no deberia cambiar.

---
name: sdd-tasks
description: Divide un diseno SDD en tareas chicas, ordenadas, verificables y listas para aplicar con TDD cuando corresponda. Use con /pi:06-tasks.
---

# Skill: sdd-tasks

## Proposito

Partir el diseno en tareas chicas, revisables y verificables.

## Cuando usar

Usar con `/pi:06-tasks` antes de implementar.

## Formato recomendado

```markdown
## Phase 1: nombre

- [ ] 1.1 Tarea concreta con archivo o modulo esperado
- [ ] 1.2 Validacion o test asociado
```

## Reglas

- Cada tarea debe tener un resultado observable.
- Mantener tareas relacionadas con su validacion.
- Incluir forecast de tamano de revision cuando el cambio pueda superar 400 lineas.
- Separar trabajo riesgoso en lotes autonomos.

## Proximo paso

Aplicar tareas y verificar.

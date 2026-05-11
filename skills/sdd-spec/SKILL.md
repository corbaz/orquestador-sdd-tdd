---
name: sdd-spec
description: Convierte una propuesta SDD en requisitos verificables y escenarios Given/When/Then. Use con /pi:04-spec antes del diseno tecnico.
---

# Skill: sdd-spec

## Proposito

Transformar una propuesta aprobada en requisitos verificables.

## Cuando usar

Usar con `/pi:04-spec` para definir comportamiento observable antes del diseno.

## Formato recomendado

```markdown
## Requirement: nombre del requisito

El sistema MUST ...

### Scenario: caso principal
Given ...
When ...
Then ...
```

## Reglas

- Usar MUST para comportamiento obligatorio.
- Usar SHOULD solo cuando haya flexibilidad real.
- Evitar detalles de implementacion salvo que sean parte del contrato.
- Cada escenario debe poder verificarse.

## Proximo paso

Ejecutar `/pi:05-design`.

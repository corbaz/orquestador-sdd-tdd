---
name: sdd-verify
description: Verifica cada requisito y escenario de la especificacion contra el resultado aplicado. Use con /pi:08-verify.
---

# Skill: sdd-verify

## Proposito

Comprobar que lo aplicado cumple la especificación.

## Cuando usar

Usar con `/pi:08-verify` después de `/pi:07-apply`.

## Reglas

- Recorrer cada requisito (MUST/SHOULD) y cada escenario Given/When/Then.
- Registrar aprobaciones, incumplimientos y hallazgos.
- No introducir cambios nuevos: solo verificar y documentar.
- Marcar el estado final (apto / revisar / bloqueado).

## Proximo paso

Ejecutar `/pi:09-review`.

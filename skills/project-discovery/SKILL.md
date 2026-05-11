---
name: project-discovery
description: Analiza estructura, stack, comandos, riesgos y convenciones de un proyecto. Use cuando el usuario ejecute /pi:02-discover o pida entender un proyecto antes de proponer cambios SDD/TDD.
---

# Skill: project-discovery

## Proposito

Guiar el discovery inicial de un proyecto antes de escribir una propuesta SDD.

## Cuando usar

Usar con `/pi:02-discover` o cuando el equipo necesite entender estructura, comandos, riesgos y convenciones antes de cambiar codigo.

## Flujo

1. Leer archivos de entrada del proyecto sin modificar codigo.
2. Identificar stack, puntos de entrada, comandos disponibles y estilo de trabajo.
3. Registrar restricciones explicitas del usuario.
4. Resumir riesgos, preguntas abiertas y evidencia encontrada.

## Salida esperada

- Resumen de arquitectura actual.
- Comandos de verificacion disponibles.
- Restricciones y archivos protegidos.
- Riesgos tecnicos y preguntas abiertas.
- Recomendacion del proximo paso: `/pi:03-propose`.

## Regla MVP

No implementar. Este skill existe para bajar incertidumbre antes de proponer cambios.

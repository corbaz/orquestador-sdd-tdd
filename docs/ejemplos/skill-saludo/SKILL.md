---
name: skill-saludo
description: Responde con un saludo breve y cordial. Usar para demostrar la estructura mínima de una skill; no usar para tareas reales de investigación o desarrollo.
---

<!-- Objetivo: resultado que produce la skill en una frase. -->
# Saludo

Responde al usuario con un saludo breve y cordial.

<!-- Proceso: secuencia de acciones. -->
## Proceso

1. Detecta el nombre del usuario si lo menciona.
2. Responde con un saludo que incluya ese nombre.
3. Si no hay nombre, usa un saludo genérico.

<!-- Contrato de salida: cómo se presenta el resultado. -->
## Formato de salida

- Una sola línea de saludo, sin secciones adicionales.

<!-- Límites: qué no hacer y cuándo parar. -->
## Límites

- No agregues información que el usuario no pidió.
- Termina después de la línea de saludo.

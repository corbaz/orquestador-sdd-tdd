# Reseña — Cómo construir una skill de agente

> Referencia práctica y reutilizable para crear, auditar y portar skills entre agentes.
> Caso real usado como ejemplo: `investigacion-web` (este repo).

## 1. Qué es una skill

Una **skill** es un documento de instrucciones que le enseña a un agente **cómo** hacer una tarea concreta, con criterios de calidad y formato de salida. No es código: es el "manual" que el agente lee antes de actuar.

- Vive en un archivo `SKILL.md` (o equivalente según el agente).
- Se activa por **descripción/triggers**, no por el nombre de un comando.
- La **fuente de verdad** es siempre el `SKILL.md`; los registros/índices son solo eso: índices.

## 2. Anatomía (contrato mínimo)

Toda skill tiene dos partes:

1. **Frontmatter** (metadatos YAML al inicio):

```markdown
---
name: investigacion-web
description: <qué hace, cuándo usarla y cuándo NO usarla>
---
```

2. **Cuerpo** con secciones. Cada sección puede llevar un comentario HTML que explica su propósito (ayuda a quien la lea/edite después):

```markdown
<!-- Objetivo: ... -->
# Título

<!-- Proceso: ... -->
## Proceso
...
```

**Regla de oro de la `description`:** debe decir **cuándo usarla Y cuándo NO usarla**. Ejemplo real:

> "Usar para investigación web y comparación de fuentes; **no usar** cuando la respuesta pueda obtenerse únicamente del proyecto local."

## 3. Proceso paso a paso (con ejemplo real)

### Paso 1 — Objetivo (una frase)
Explicá el resultado que produce la skill, sin entrar en el "cómo".

- *investigacion-web:* "Realiza investigaciones web documentadas que respondan directamente a la pregunta del usuario."

### Paso 2 — Descripción del frontmatter
Escribí qué hace, cuándo se usa y cuándo no. Es lo que decide si el agente la activa.

- *investigacion-web:* la descripción menciona "buscar, contrastar y sintetizar información verificable de la web con citas" y aclara el caso negativo.

### Paso 3 — Entrada interactiva (si aplica)
Si la tarea necesita datos del usuario, definí un **cuestionario** en un solo mensaje y esperá la respuesta. Completá previamente lo que el usuario ya dio.

- *investigacion-web:* cuestionario con `Pregunta principal`, `Fuentes iniciales`, `Sugerencia o contexto`, `Fuentes adicionales`.

### Paso 4 — Proceso (secuencia flexible)
Numerá los pasos que ejecuta el agente, en orden lógico pero flexible.

- *investigacion-web:* 7 pasos (identificar pregunta → dividir en facetas → buscar → abrir páginas → contrastar → completar lagunas → sintetizar).

### Paso 5 — Criterios de calidad
Definí cómo elegir fuentes/datos correctos y cómo distinguir lo confiable de lo descartable.

- *investigacion-web:* prioriza fuentes primarias y documentación oficial; descarta SEO superficial.

### Paso 6 — Evidencia / invariantes
Reglas que deben cumplirse siempre (citas, no inventar, marcar inferencias).

- *investigacion-web:* "No inventes títulos, autores, fechas, citas ni direcciones web."

### Paso 7 — Formato de salida
Definí secciones de salida, pero **no agregues secciones vacías**.

- *investigacion-web:* `## Resumen`, `## Hallazgos` (con citas), `## Recomendaciones` (opcional), `## Fuentes`, `## Brechas`.

### Paso 8 — Límites y criterio de finalización
Decí cuándo parar y qué NO hacer.

- *investigacion-web:* "Detén la búsqueda cuando las facetas importantes estén respaldadas y nuevas consultas difícilmente cambien la conclusión."

### Paso 9 (opcional) — Subagente que la ejecuta
Si la skill la ejecuta otro agente, indicá dónde está definido.

- *investigacion-web:* sección "Subagente investigador" → `.codex/agents/investigador.toml`.

## 4. Matriz de portabilidad

El **contenido** (objetivo, proceso, criterios, formato) es portable. Lo que cambia es la **carpeta y el formato** de cada agente:

| Agente | Dónde vive | Formato |
|--------|-----------|---------|
| Pi | `.agents/skills/<nombre>/SKILL.md` (proyecto) o `~/.pi/agent/skills/` (global) | Markdown + frontmatter `name`/`description` |
| Codex | subagente en `.codex/agents/<nombre>.toml` + skills en `~/.codex/skills/` | TOML con `developer_instructions` y referencia `$<skill>` |
| Claude | `~/.claude/skills/<nombre>/SKILL.md` | Markdown + frontmatter |
| opencode-go | `~/.config/opencode/skills/<nombre>/SKILL.md` | Markdown + frontmatter |

**Estrategia recomendada:** mantener **una sola skill canónica** (ej. en `.agents/skills/`) y documentar la adaptación, en vez de duplicar archivos por agente. Duplicar solo cuando el agente lo exija.

## 5. Checklist de calidad (skill-creator / skill-improver)

- [ ] `name` en minúsculas, sin espacios (kebab-case).
- [ ] `description` accionable: qué hace + cuándo usarla + cuándo NO usarla.
- [ ] Objetivo en una frase.
- [ ] Proceso con pasos ordenados y flexibles.
- [ ] Criterios de calidad / invariantes explícitos.
- [ ] Formato de salida definido (sin secciones vacías).
- [ ] Límites y criterio de finalización.
- [ ] Sin instrucciones contradictorias ni ambiguas.
- [ ] Separación clara entre skill (agnóstica) y subagente (herramientas específicas).

## 6. Ejemplo mínimo completo

Ver `docs/ejemplos/skill-saludo/SKILL.md` — una skill mínima válida para copiar como plantilla.

## 7. Errores comunes

- Descripción que solo dice qué hace, sin decir cuándo NO usarla.
- Mezclar "qué" (skill) con "con qué herramienta" (subagente/agente).
- Secciones de salida vacías impuestas siempre.
- Sin criterio de finalización → búsquedas/tareas interminables.
- Duplicar la skill por agente sin necesidad.

## 8. Cómo auditar una skill existente

1. Releer la `description`: ¿activa bien y descarta bien?
2. Recorrer cada sección: ¿falta alguna de las del paso a paso?
3. Verificar coherencia con el subagente que la ejecuta.
4. Aplicar el checklist de la sección 5.
5. Corregir o justificar cada hallazgo.

---
name: investigacion-web
description: Investiga preguntas que requieren buscar, contrastar y sintetizar información verificable de la web con citas. Puede incorporar URLs, archivos o notas proporcionados por el usuario como fuentes iniciales. Usar para investigación web y comparación de fuentes; no usar cuando la respuesta pueda obtenerse únicamente del proyecto local.
---

<!-- Objetivo: explica en una frase el resultado que debe producir la skill. -->
# Investigación web
Realiza investigaciones web documentadas que respondan directamente a la pregunta del usuario.

<!-- Subagente: quién ejecuta la skill y cómo se delega la investigación. -->
## Subagente investigador
Esta skill puede ejecutarla un subagente investigador de solo lectura (por ejemplo, en Codex: `.codex/agents/investigador.toml`). El agente principal arma el encargo con esta skill y le delega la investigación; el subagente devuelve el informe con citas. Si no hay subagente disponible, el agente principal ejecuta la skill directamente.

<!-- Entrada interactiva: ayuda al usuario a preparar el encargo sin memorizar su estructura. -->
## Preparación del encargo
Cuando el usuario invoque esta skill para usar el subagente investigador y todavía no haya entregado un encargo completo, el agente principal debe presentar este cuestionario en un solo mensaje y esperar la respuesta:

```text
Completemos el encargo para el investigador:

1. Pregunta principal (obligatoria):
2. Fuentes iniciales (opcionales; puedes responder "ninguna"):
3. Sugerencia, contexto o aspecto que te interesa comprobar (opcional):
4. ¿Puede buscar fuentes adicionales? (sí, por defecto / no):
```

- Completa previamente los campos que el usuario ya haya mencionado y pregunta solamente por los datos restantes.
- La única entrada obligatoria es una pregunta suficientemente concreta. Las fuentes y el contexto orientan la búsqueda, pero nunca sustituyen la investigación ni limitan al investigador salvo indicación expresa.
- Si el usuario omite una respuesta opcional, utiliza `ninguna` para fuentes o contexto y `sí` para búsquedas adicionales.
- Después de recibir las respuestas, construye el encargo con los encabezados `Pregunta`, `Fuentes iniciales`, `Sugerencia o contexto` y `Fuentes adicionales`, y entrégalo al subagente investigador.
- No muestres el cuestionario ni vuelvas a pedir datos cuando seas el subagente y hayas recibido ese encargo estructurado; comienza directamente la investigación.
- Si el usuario invoca la skill con una pregunta y un encargo ya suficientemente completos, evita repetir el formulario y comienza o delega la investigación.

<!-- Entrada opcional: permite orientar la investigación con material aportado por el usuario. -->
## Fuentes proporcionadas por el usuario
- Acepta como fuentes iniciales URLs, repositorios, videos, archivos, fragmentos de texto o notas incluidas en la tarea.
- Si existen fuentes proporcionadas, revísalas primero cuando sean accesibles y relevantes para comprender el alcance, la terminología y la intención del usuario.
- Trátalas como contexto y evidencia candidata, no como información automáticamente correcta, actual u oficial.
- Contrasta sus afirmaciones importantes con documentación oficial o fuentes primarias cuando la pregunta requiera verificación.
- Distingue en el informe entre fuentes proporcionadas por el usuario y fuentes encontradas durante la investigación cuando esa diferencia ayude a interpretar el resultado.
- Si una fuente no es accesible, indica la limitación y continúa con las demás fuentes. Solicita una transcripción o copia solamente cuando sea esencial para responder.
- Respeta una instrucción del usuario que limite la investigación exclusivamente a las fuentes proporcionadas.

<!-- Proceso: define la secuencia flexible de acciones que realiza la skill. -->
ok

1. Identifica la pregunta principal, el alcance, las fuentes proporcionadas y si la actualidad de la información es relevante.
2. Divide la investigación en facetas solamente cuando eso mejore la cobertura.
3. Busca desde distintos ángulos usando la skill `busqueda` (matriz de fuentes), priorizando fuentes primarias y documentación oficial.
4. Abre las páginas originales más prometedoras y verifica que respalden realmente las afirmaciones. Si una página requiere JavaScript, usa la skill `playwright-cli` (navegador en modo lectura).
5. Contrasta fechas, versiones, cifras y posibles desacuerdos entre las fuentes.
6. Realiza búsquedas adicionales cuando existan lagunas importantes.
7. Sintetiza los hallazgos y distingue claramente entre hechos confirmados e inferencias.

<!-- Criterios: establece cómo evaluar y escoger fuentes confiables. -->
## Selección de fuentes
- Prioriza documentación oficial, publicaciones académicas, normas y otras fuentes primarias.
- Utiliza fuentes secundarias confiables cuando aporten contexto o experiencia práctica.
- Evalúa cada fuente por relevancia, autoridad, actualidad y relación directa con la pregunta.
- Para información cambiante, comprueba tanto la fecha de publicación como la fecha del acontecimiento.
- Descarta contenido SEO superficial, duplicado, desactualizado o que no respalde directamente los hallazgos.
- No cites resultados de búsqueda cuando esté disponible la página original.
- Usa Reddit y foros solo como contexto o experiencia práctica; nunca como evidencia de un hecho verificable.

<!-- Invariantes: reglas de calidad que deben cumplirse en toda investigación. -->
## Evidencia y citas
- Respalda con citas las afirmaciones importantes, especialmente cifras, fechas, versiones y hechos que puedan cambiar.
- Enlaza directamente a la página que contiene la evidencia, no a una lista de resultados.
- Comprueba que cada fuente citada respalde realmente la afirmación asociada.
- No inventes títulos, autores, fechas, citas ni direcciones web.
- Señala explícitamente las inferencias y explica qué evidencia las sustenta.
- Cuando las fuentes confiables discrepen, presenta las posiciones relevantes y explica la diferencia.
- Prefiere resumir con palabras propias; utiliza citas textuales solamente cuando la formulación original sea importante.


<!-- Contrato de salida: define cómo presentar el resultado sin imponer secciones innecesarias. -->
## Formato de salida
Adapta la extensión y el nivel técnico a la pregunta y al usuario.

Utiliza las siguientes secciones cuando correspondan:

- `## Resumen`: respuesta directa en dos o tres párrafos breves.
- `## Hallazgos`: resultados principales ordenados por importancia, con las citas junto a las afirmaciones que respaldan.
- `## Recomendaciones`: acciones concretas derivadas de la evidencia; omitir cuando la pregunta no requiera recomendaciones.
- `## Fuentes`: lista breve de las fuentes principales consultadas y por qué fueron relevantes.
- `## Brechas`: información que no pudo verificarse, incertidumbres y próximos pasos posibles.

No añadas secciones vacías. Responde primero la pregunta y utiliza el resto del informe para aportar evidencia y contexto.

<!-- Límites: evita búsquedas interminables, afirmaciones sin respaldo y acciones fuera del alcance. -->
## Límites y criterio de finalización
- Mantén la investigación dentro del alcance solicitado por el usuario.
- Detén la búsqueda cuando las facetas importantes estén respaldadas por fuentes confiables y nuevas consultas difícilmente cambiarían la conclusión.
- No aumentes el número de fuentes solamente para aparentar mayor profundidad.
- Si no existe evidencia suficiente, indícalo claramente en lugar de completar la respuesta con suposiciones.
- Utiliza comandos de shell únicamente para inspección o procesamiento local relacionado con la investigación.
- No modifiques archivos, servicios ni fuentes externas salvo que el usuario lo solicite explícitamente.

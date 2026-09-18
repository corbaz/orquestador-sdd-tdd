---
name: busqueda
description: Busca información en una matriz de fuentes (APIs académicas, documentación oficial, comunidades y código) usando curl. Usar para LOCALIZAR fuentes primarias; no usar como fuente citada (citar siempre la página original, nunca el buscador).
---

<!-- Objetivo: resultado que produce la skill. -->
# Búsqueda de fuentes

Localiza fuentes primarias consultando una matriz de APIs de búsqueda. Devuelve candidatos (títulos + URLs) para después leerlos con `curl` o `playwright-cli`.

<!-- Matriz: lista extensible de fuentes. Para agregar una, sumá una fila a la tabla y respetá el patrón. -->
## Matriz de fuentes

| Fuente | Tipo | Comando `curl` | Cuándo usarla | Notas |
|--------|------|----------------|---------------|-------|
| OpenAlex | Académico (papers) | `curl "https://api.openalex.org/works?search=<q>&per-page=5"` | Papers, citas, autores | Gratis, sin key ✅ |
| Crossref | Metadatos / DOI | `curl "https://api.crossref.org/works?query=<q>&rows=5"` | DOIs, referencias | Gratis ✅ |
| arXiv | Preprints | `curl "https://export.arxiv.org/api/query?search_query=all:<q>&max_results=5"` | Física, CS, math | Gratis, devuelve Atom XML ✅ |
| Semantic Scholar | Papers (IA) | `curl "https://api.semanticscholar.org/graph/v1/paper/search?query=<q>&limit=5&fields=title,url,year"` | Papers + IA | Rate-limit (429 sin key) ⚠️ |
| PubMed | Biomedicina | `curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=<q>&retmax=5"` | Medicina/biología | Gratis |
| Context7 | Docs de librerías/frameworks actualizadas | `curl "https://context7.com/api/v1/search?query=<q>"` | Docs de código (React, Next, etc.) | Gratis, sin key ✅ |
| Microsoft Learn | Docs oficiales Microsoft | `curl "https://learn.microsoft.com/api/search?search=<q>&locale=en-us"` | Productos Microsoft | Gratis ✅ |
| GitHub | Repos / código | `curl "https://api.github.com/search/repositories?q=<q>&per_page=5"` | Proyectos, código | Gratis, rate-limit |
| Stack Exchange | Q&A técnico | `curl "https://api.stackexchange.com/2.3/search/advanced?site=stackoverflow&q=<q>"` | Problemas técnicos | Gratis |
| Wikipedia | Enciclopedia | `curl "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=<q>&format=json"` | Contexto general | Solo contexto, no cita |
| Reddit | Comunidad / experiencia | `curl -A "Mozilla/5.0" "https://old.reddit.com/search.json?q=<q>&limit=5"` | Experiencia práctica, opiniones | ⚠️ Bloquea a menudo; solo contexto, nunca cita |

<!-- Criterio: cómo elegir la fuente según la pregunta. -->
## Cómo elegir la fuente

- ¿Pregunta científica / papers? → OpenAlex, Semantic Scholar, arXiv, PubMed, Crossref.
- ¿Documentación de una librería/framework? → Context7.
- ¿Producto Microsoft? → Microsoft Learn.
- ¿Código / repos? → GitHub, Stack Exchange.
- ¿Opiniones / experiencia de usuarios? → Reddit (solo como contexto, nunca como evidencia de un hecho).

<!-- Proceso: secuencia de acciones. -->
## Proceso

1. Identificá el tipo de pregunta y elegí 1–3 fuentes de la matriz.
2. Ejecutá el `curl` correspondiente y extraé títulos + URLs.
3. Abrí las URLs originales más prometedoras (con `curl` si es estático, con `playwright-cli` si requiere JS).
4. Citá la **página original**, no el resultado de búsqueda.

<!-- Invariantes: reglas que no se rompen. -->
## Reglas

- Citar siempre la fuente original, nunca el buscador ni la API.
- Reddit y foros son **contexto**, no evidencia de hechos.
- Si una fuente devuelve 429/403, cambiá de fuente o esperá (no fuerces).
- No inventar títulos ni URLs: usar solo lo que devuelva la API.

<!-- Extensibilidad: cómo agregar fuentes nuevas. -->
## Cómo agregar fuentes nuevas

1. Agregá una fila a la tabla "Matriz de fuentes" con: Fuente, Tipo, Comando `curl`, Cuándo usarla, Notas.
2. Verificá el endpoint real con `curl` antes de documentarlo.
3. Mantené el patrón: endpoint + parámetros + qué devuelve.

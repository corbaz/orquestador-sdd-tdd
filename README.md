# orquestador-sdd-tdd

Paquete global de Pi para guiar proyectos con SDD y TDD paso a paso, desde la idea hasta la entrega verificada.

Version actual: `1.6.0`

[![CI](https://github.com/corbaz/orquestador-sdd-tdd/actions/workflows/ci.yml/badge.svg)](https://github.com/corbaz/orquestador-sdd-tdd/actions/workflows/ci.yml)

---

## Indice

- [Instalacion](#instalacion)
- [Si arrancas un proyecto nuevo](#si-arrancas-un-proyecto-nuevo)
- [Si ya tenes un proyecto en uso](#si-ya-tenes-un-proyecto-en-uso)
- [Comandos del orquestador](#comandos-del-orquestador)
- [Comandos de Pi utiles](#comandos-de-pi-utiles)
- [Flujo completo paso a paso](#flujo-completo-paso-a-paso)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## Instalacion

**Requisito**: tener Pi Coding Agent instalado.

```bash
pi install git:github.com/corbaz/orquestador-sdd-tdd
```

Para probar localmente desde este repo:

```bash
pi install git:file:///C:/Compartido/pi
```

Para actualizar a la ultima version:

```bash
pi update git:github.com/corbaz/orquestador-sdd-tdd
```

El orquestador se carga automaticamente al abrir Pi. Para ver los comandos disponibles:

```bash
pi --no-skills
```

---

## Si arrancas un proyecto nuevo

1. Crea la carpeta del proyecto:

```bash
mkdir mi-proyecto
cd mi-proyecto
git init
```

2. Abri Pi:

```bash
pi --no-skills
```

3. Ejecuta los comandos en orden:

```text
/pi:01-init
```

Pi te va a mostrar una guia. Segui las instrucciones de cada paso. Cuando termines un paso, ejecuta el siguiente:

```text
/pi:02-discover
/pi:03-propose
/pi:04-spec
/pi:05-design
/pi:06-tasks
/pi:07-apply
/pi:08-verify
/pi:09-review
```

Cada comando te explica que hacer y cual es el siguiente paso.

Al finalizar `/pi:09-review` el ciclo esta completo. Podes generar un reporte final con:

```text
/pi:99-report
```

---

## Si ya tenes un proyecto en uso

1. Entra al proyecto:

```bash
cd /ruta/de/tu/proyecto
```

2. Abri Pi:

```bash
pi --no-skills
```

3. Prepara las convenciones del orquestador:

```text
/pi:99-migrate
```

Esto crea:
- `.gitignore` con `.pi/` y `.DS_Store` (si no existen)
- `docs/sdd/` para los artefactos SDD
- `AGENTS.md` con instrucciones basicas

4. Ejecuta un diagnostico:

```text
/pi:99-doctor
```

El doctor te va a decir:

- Si ya hay metadata del orquestador (proyectos que ya usaron el flujo)
- Que artefactos SDD existen
- Si faltan archivos requeridos
- Si hay conflictos logicos entre lo que ya documentaste
- Si hay temas fuera de alcance que reaparecen como trabajo activo

5. Segun el estado del proyecto:

- **Si el doctor no reporta errores**: podes arrancar desde el paso que corresponda. Por ejemplo, si ya tenes una especificacion, arranca desde `/pi:05-design`.
- **Si el doctor reporta warnings**: revisalos antes de avanzar. Podes usar `/pi:99-fix` para corregir automaticamente artefactos faltantes.
- **Si el doctor reporta errores**: corregilos primero. El orquestador no avanza si hay conflictos de alcance.

El estado del flujo se guarda en `.pi/orquestador-sdd-tdd/metadata.json`.

---

## Comandos del orquestador

### Flujo principal

| Comando | Cuando usarlo | Que hace |
| --- | --- | --- |
| `/pi:01-init` | Al empezar un proyecto | Crea estado local, guia inicial |
| `/pi:02-discover` | Despues de init | Releva el proyecto, riesgos, stack |
| `/pi:03-propose` | Despues de discover | Redacta propuesta SDD |
| `/pi:04-spec` | Despues de propose | Define requisitos y escenarios |
| `/pi:05-design` | Despues de spec | Documenta arquitectura |
| `/pi:06-tasks` | Despues de design | Divide en tareas implementables |
| `/pi:07-apply` | Despues de tasks | Aplica tareas con TDD |
| `/pi:08-verify` | Despues de apply | Verifica contra la especificacion |
| `/pi:09-review` | Despues de verify | Cierra el ciclo con evidencia |

### Auxiliares (no avanzan el flujo)

| Comando | Cuando usarlo | Que hace |
| --- | --- | --- |
| `/pi:99-doctor` | En cualquier momento | Diagnostica el proyecto, aplica mantenimiento seguro |
| `/pi:99-migrate` | En proyectos existentes | Prepara convenciones: `.gitignore`, `docs/sdd/`, `AGENTS.md` |
| `/pi:99-report` | Al finalizar un ciclo | Genera `docs/sdd/99-reporte-validacion.md` |
| `/pi:99-fix` | Cuando el doctor encuentra faltantes | Corrige automaticamente artefactos SDD faltantes |
| `/pi:99-version` | En cualquier momento | Muestra la version instalada del orquestador |

**Importante**: los comandos auxiliares no avanzan el flujo. No reemplazan `/pi:01-init` a `/pi:09-review`.

---

## Comandos de Pi utiles

| Comando | Que hace |
| --- | --- |
| `pi --no-skills` | Abre Pi cargando solo el orquestador (recomendado) |
| `pi update git:github.com/corbaz/orquestador-sdd-tdd` | Actualiza el orquestador a la ultima version |
| `pi list` | Muestra los packages instalados |
| `pi --help` | Muestra todas las opciones de Pi |
| `! bash <comando>` | Ejecuta un comando del sistema sin salir de Pi |
| `ctrl+c` o `ctrl+d` | Sale de Pi |

---

## Flujo completo paso a paso

### 1. Init (`/pi:01-init`)

Crea el estado local del orquestador en `.pi/orquestador-sdd-tdd/`. No necesita nada del proyecto.

```text
/pi:01-init
```

Despues de esto, podes ver el archivo `metadata.json`:

```bash
cat .pi/orquestador-sdd-tdd/metadata.json
```

### 2. Discover (`/pi:02-discover`)

El agente revisa la estructura del proyecto, busca archivos como `package.json`, `README.md`, detecta si hay Git, comandos utiles, riesgos y convenciones.

Resultado: deja evidencia en el estado del flujo. No modifica codigo.

### 3. Propose (`/pi:03-propose`)

Redacta una propuesta SDD con problema, objetivo, alcance, fuera de alcance, riesgos y plan de validacion. Se guarda como artefacto versionable.

### 4. Spec (`/pi:04-spec`)

Define requisitos con prioridad MUST/SHOULD y escenarios en formato Given/When/Then.

### 5. Design (`/pi:05-design`)

Decide arquitectura, componentes, contratos, persistencia y testing. No implementa codigo.

### 6. Tasks (`/pi:06-tasks`)

Divide el diseno en tareas implementables con dependencias, validaciones y tamano estimado de revision.

### 7. Apply (`/pi:07-apply`)

Implementa las tareas generadas. Prioriza TDD: primero escribir test, despues codigo, despues refactor.

### 8. Verify (`/pi:08-verify`)

Verifica que el comportamiento implementado cumple los requisitos y escenarios de la especificacion.

### 9. Review (`/pi:09-review`)

Cierra el ciclo con resumen de lo aplicado, verificado y evidencia generada.

### Reporte final

```text
/pi:99-report
```

Genera `docs/sdd/99-reporte-validacion.md` con estado `apto`, `revisar` o `bloqueado`.

---

## Preguntas frecuentes

**¿Puedo saltarme un paso?**
No. El orquestador bloquea los pasos adelantados. Tenes que completar el paso anterior primero.

**¿Que pasa si ejecuto el mismo comando dos veces?**
No pasa nada. El orquestador avanza solo una vez cada paso y no retrocede.

**¿Donde se guarda el estado?**
En `.pi/orquestador-sdd-tdd/metadata.json`. Tambien en SQLite local.

**¿Puedo borrar el estado?**
Si, borrando la carpeta `.pi/orquestador-sdd-tdd/`. Despues ejecuta `/pi:01-init` de nuevo.

**¿Los comandos `/pi:99-*` son obligatorios?**
No. Son auxiliares. El flujo principal funciona sin ellos.

**¿Que pasa si no uso `--no-skills`?**
Pi tambien carga otras skills. El orquestador sigue funcionando, pero ves mas comandos.

**¿Puedo usar el orquestador sin Git?**
Si, pero el doctor no va a aplicar ignores automaticos.

**¿Que es SQLite y para que sirve?**
SQLite guarda eventos del flujo en una base de datos local. Se activa automaticamente. Podes consultarla con `openProjectDatabase()`.

---

Ver tambien:
- `docs/mantenimiento.md` — uso detallado de comandos auxiliares
- `docs/produccion.md` — criterio de produccion
- `CHANGELOG.md` — historial de versiones

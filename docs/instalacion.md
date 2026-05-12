# Instalacion

`orquestador-sdd-tdd` es un Pi Package global para guiar un flujo SDD/TDD.

## Requisitos

- Pi Coding Agent con soporte de packages globales.
- Node.js compatible con modulos ESM.
- Bun para comandos de desarrollo local del repo.
- Acceso de escritura a `~/.pi/agent/` y al proyecto local.

## Instalacion global

Desde GitHub:

```bash
pi install git:github.com/corbaz/orquestador-sdd-tdd
```

Para probar desde el repo local:

```bash
pi install git:file:///C:/Compartido/pi
```

Luego Pi carga el manifest `pi` de `package.json`:

- `extensions/orchestrator.ts`
- skills en `skills/*/SKILL.md`

Los archivos de `prompts/` son referencia interna del repo. No se registran en el manifest para que el usuario final vea solo comandos `/pi:NN-accion` y no duplicados `/NN-accion`.

## Desarrollo con Bun

```bash
bun run check
```

No usar `npm install -g` para instalar el orquestador. Esto es un Pi Package: se instala con `pi install`.

## Verificacion inicial

En un proyecto, ejecutar:

```text
/pi:01-init
```

El comando debe crear metadata local en `.pi/orquestador-sdd-tdd/` y mostrar el proximo paso.

## Nota MVP1

El paquete prioriza guia, estructura y contratos. La persistencia SQLite queda preparada por SQL y rutas estables; en MVP1 los `.sqlite` son placeholders y no se implementa un adapter SQLite real.

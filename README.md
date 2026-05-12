# orquestador-sdd-tdd

Paquete global de Pi para guiar proyectos con SDD y TDD paso a paso.

## Objetivo

Mantener Pi limpio y agregar un orquestador global reutilizable en cualquier carpeta. El paquete carga comandos, skills y hooks; cada proyecto guarda solo su estado local.

Los prompts numerados quedan en `prompts/` como referencia interna del repo, pero no se registran como slash commands para evitar duplicar `/01-init` con `/pi:01-init`.

## Instalacion

Con Pi instalado, instalar desde GitHub:

```bash
pi install git:github.com/corbaz/orquestador-sdd-tdd
```

Para probar localmente desde este repo:

```bash
pi install git:file:///C:/Compartido/pi
```

## Desarrollo local

Este repo usa Bun para comandos de desarrollo:

```bash
bun run check
```

No hace falta publicar con npm para usarlo con Pi. El mecanismo de uso es `pi install`.

## Flujo MVP 1

```text
/pi:01-init
/pi:02-discover
/pi:03-propose
/pi:04-spec
/pi:05-design
/pi:06-tasks
```

## Persistencia

Global:

```text
~/.pi/agent/orquestador-sdd-tdd/orchestrator.sqlite
```

Local por proyecto:

```text
<project>/.pi/orquestador-sdd-tdd/project.sqlite
```

En MVP 1 se crean rutas, schema SQL y metadata. Los archivos `.sqlite` son placeholders: el adapter SQLite real queda fuera de MVP1 y reservado para la siguiente etapa.

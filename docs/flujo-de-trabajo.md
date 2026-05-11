# Flujo de trabajo

## Secuencia

1. `/pi:01-init`: inicializa el estado del orquestador.
2. `/pi:02-discover`: releva proyecto, riesgos y comandos.
3. `/pi:03-propose`: redacta propuesta SDD.
4. `/pi:04-spec`: define requisitos y escenarios.
5. `/pi:05-design`: documenta diseno tecnico.
6. `/pi:06-tasks`: crea tareas implementables.

## Regla de orden

Los comandos deben ejecutarse en orden. El hook `validate-workflow-step` usa metadata local para bloquear pasos adelantados.

## Filosofia

No se empieza por codigo. Primero se baja incertidumbre y se acuerda comportamiento. Eso evita implementar rapido algo equivocado.

## Resultado esperado por fase

- Init: estado local y guia del flujo.
- Discover: evidencia del proyecto.
- Propose: alcance acordable.
- Spec: comportamiento verificable.
- Design: decisiones tecnicas.
- Tasks: plan aplicable y revisable.

## Apply y verify

MVP1 no automatiza apply/verify. El paquete deja la base para que una fase posterior use las tareas generadas con TDD cuando el proyecto lo permita.

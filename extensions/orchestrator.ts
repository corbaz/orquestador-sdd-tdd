import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { registerCaptureSessionHook } from "./hooks/capture-session.ts";
import { registerCompactContextHook } from "./hooks/compact-context.ts";
import { registerProtectSecretsHook } from "./hooks/protect-secrets.ts";
import { registerValidateWorkflowStepHook } from "./hooks/validate-workflow-step.ts";
import {
  advanceWorkflowStep,
  canRunWorkflowStep,
  ensurePersistenceFiles,
  readProjectMetadata,
  runProjectDoctor,
  runProjectFix,
  runProjectMigration,
  runProjectValidationReport,
  type ProjectDoctorReport,
  type ProjectFixReport,
  type ProjectMigrationReport,
  type ProjectValidationReport,
  type WorkflowStep,
} from "./lib/persistence.ts";

const ORCHESTRATOR_VERSION = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
).version as string;

type CommandDefinition = {
  step: WorkflowStep;
  command: string;
  description: string;
  body: string;
  next: string;
  prompt: string;
};

const COMMANDS: CommandDefinition[] = [
  {
    step: "01-init",
    command: "pi:01-init",
    description: "Pregunta cual es el objetivo del cambio y prepara el proyecto.",
    body: "Pregunta al usuario el objetivo del cambio y prepara el estado local del orquestador.",
    next: "Siguiente paso: /pi:02-discover para relevar el proyecto y sus restricciones.",
    prompt: "Actua como orquestador SDD/TDD. Inicializa el flujo. Analiza el proyecto actual (no el codigo del orquestador). PREGUNTA al usuario: '¿Cual es el objetivo de este cambio?' Espera su respuesta y registrala. Luego explica que el proximo paso es /pi:02-discover para relevar el proyecto.",
  },
  {
    step: "02-discover",
    command: "pi:02-discover",
    description: "Analiza el codigo y muestra al usuario lo que encontro.",
    body: "Releva estructura, tecnologias, riesgos, convenciones y estado actual del proyecto sin modificar codigo.",
    next: "Siguiente paso: /pi:03-propose para redactar una propuesta acotada.",
    prompt: "Ejecuta discovery del proyecto actual (no el codigo del orquestador). PREGUNTA al usuario: '¿Que cambio queres hacer?' si no lo definio antes. Releva estructura, comandos, riesgos, convenciones y estado actual. No implementes todavia. Al final, PREGUNTA: '¿Que objetivo concreto tiene este cambio?' y espera la respuesta antes de continuar.",
  },
  {
    step: "03-propose",
    command: "pi:03-propose",
    description: "Pregunta problema, alcance y riesgos uno por uno y escribe la propuesta.",
    body: "Convierte el discovery en una propuesta con problema, objetivo, alcance, riesgos y validacion.",
    next: "Siguiente paso: /pi:04-spec para definir requisitos y escenarios verificables.",
    prompt: "Redacta una propuesta SDD para el proyecto actual (no el orquestador). NO muestres el discovery ni preguntes si esta bien (eso ya se hizo en /pi:02-discover). Arranca directo: PRIMERO preguntale al usuario 'Para este cambio, ¿cual es el problema concreto que estamos resolviendo?' PROPONELE un ejemplo basado en el proyecto actual que ya analizaste. Espera su respuesta, despues preguntale '¿El objetivo es correcto?' y proponé. Segui asi con cada seccion: problema, objetivo, alcance, fuera de alcance, riesgos, validacion. Siempre proponé primero basado en el proyecto, despues preguntá '¿Esta bien? ¿Queres cambiar algo?'. Al final mostra el resumen y preguntá '¿Queres modificar, agregar o quitar algo?' hasta que diga 'listo'.",
  },
  {
    step: "04-spec",
    command: "pi:04-spec",
    description: "Pregunta requisitos MUST/SHOULD y escenarios, y escribe la especificacion.",
    body: "Define comportamiento observable con requisitos obligatorios, deseables y escenarios de validacion.",
    next: "Siguiente paso: /pi:05-design para decidir la arquitectura de implementacion.",
    prompt: "Trabaja sobre el proyecto actual, no el orquestador. PRIMERO: mostrale al usuario la propuesta de docs/sdd/ y preguntale: '¿Esta propuesta esta completa para vos? ¿Queres modificar algo o agregar algo mas?' Si el usuario quiere cambios, ayudalo a modificar la propuesta iterando hasta que diga 'listo' o 'dale'. RECIEN DESPUES de su confirmacion, empeza a escribir la especificacion SDD. Para cada seccion usa el termino en ingles con su traduccion entre parentesis, ej: MUST (obligatorio), SHOULD (deseable). Para escenarios usa 'Dado que / Cuando / Entonces' en vez de 'Given/When/Then' para que sea mas claro en espanol. Para cada MUST, SHOULD y escenario: PRIMERO mostra tus propuestas basadas en el proyecto actual con frases tipo 'Esto es lo que propongo segun el proyecto:' y lista tus ejemplos concretos. DESPUES pregunta '¿Agregamos este? ¿Queres modificarlo o proponer otro?' Itera hasta que confirme. Al final preguntale si quiere agregar mas.",
  },
  {
    step: "05-design",
    command: "pi:05-design",
    description: "Pregunta decisiones tecnicas y escribe el diseno de arquitectura.",
    body: "Documenta componentes, contratos, decisiones de arquitectura, testing y riesgos tecnicos.",
    next: "Siguiente paso: /pi:06-tasks para partir el trabajo en tareas implementables.",
    prompt: "Trabaja sobre el proyecto actual, no el orquestador. PRIMERO: mostra al usuario la especificacion actual y preguntale: '¿La especificacion esta completa? ¿Queres revisar o agregar algo antes de pasar al diseno?' Si pide cambios, ayudalo a modificar la especificacion. RECIEN DESPUES de su confirmacion, empeza el diseno. PROPONE cada decision basandote en el proyecto actual. Por ejemplo: 'El frontend usa X, el backend Y, el editor se integraria en Z. ¿Te parece bien este enfoque?' No preguntes en blanco. Para cada tema (componentes afectados, decisiones de arquitectura, contratos, testing, riesgos), proponé ejemplos concretos del proyecto, preguntá si esta bien, iterá hasta confirmar.",
  },
  {
    step: "06-tasks",
    command: "pi:06-tasks",
    description: "Pregunta el orden y genera tareas implementables con TDD.",
    body: "Divide el diseno en tareas ordenadas con dependencias, validaciones y estimaciones.",
    next: "Siguiente paso: /pi:07-apply para aplicar las tareas con TDD en lotes pequenos.",
    prompt: "Trabaja sobre el proyecto actual, no el orquestador. PRIMERO: mostra al usuario el diseno actual y preguntale: '¿El diseno esta completo? ¿Queres modificar algo antes de pasar a tareas?' Si pide cambios, ayudalo. RECIEN DESPUES de su confirmacion, genera las tareas. PREGUNTA: 1) '¿En que orden preferis implementar las tareas?' 2) '¿Cual es el tamano maximo de revision que te sentis comodo?' 3) '¿Preferis TDD estricto o aplicacion primero?' Genera las tareas con dependencias, validaciones y forecast. Muestra el resultado y pregunta si quiere ajustar algo.",
  },
  {
    step: "07-apply",
    command: "pi:07-apply",
    description: "Aplica las tareas con TDD en lotes pequenos.",
    body: "Implementa las tareas generadas en /pi:06-tasks con TDD y mantiene trazabilidad con requisitos.",
    next: "Siguiente paso: /pi:08-verify para verificar el resultado contra la especificacion.",
    prompt: "Ejecuta las tareas del proyecto actual en orden, aplicando TDD. Revisa la especificacion, implementa, y documenta cada tarea completada. No saltes pasos de verificacion.",
  },
  {
    step: "08-verify",
    command: "pi:08-verify",
    description: "Verifica el resultado contra la especificacion.",
    body: "Revisa que el comportamiento implementado cumple los requisitos y escenarios definidos en /pi:04-spec.",
    next: "Siguiente paso: /pi:09-review para cerrar el ciclo y generar evidencia final.",
    prompt: "Verifica cada requisito y escenario de la especificacion contra el codigo/resultado actual. Documenta hallazgos, aprobaciones e incumplimientos.",
  },
  {
    step: "09-review",
    command: "pi:09-review",
    description: "Cierra el ciclo con evidencia final.",
    body: "Consolida los resultados de apply y verify en un reporte final versionable.",
    next: "Siguiente paso: el ciclo esta completo. Revisa docs/sdd/ para los artefactos finales.",
    prompt: "Genera un cierre del ciclo SDD con resumen de tareas aplicadas, verificacion de requisitos, evidencia de tests y recomendaciones finales. No introduzcas cambios nuevos.",
  },
];

export default function registerOrquestadorSddTdd(pi: ExtensionAPI): void {
  const v = ORCHESTRATOR_VERSION;
  const projectRoot = process.cwd();
  console.log(buildBannerText(v, projectRoot));
  console.log("  💡 Recordá todos los comandos con: /pi:99-ayuda");
  console.log("");

  registerProtectSecretsHook(pi);
  registerCaptureSessionHook(pi);
  registerCompactContextHook(pi);
  registerValidateWorkflowStepHook(pi);

  for (const definition of COMMANDS) {
    pi.registerCommand(definition.command, {
      description: definition.description,
      handler: async (_args: string, ctx: any) => {
        const projectRoot = ctx?.cwd ?? process.cwd();
        ensurePersistenceFiles(projectRoot);

        const metadata = readProjectMetadata(projectRoot);
        if (!canRunWorkflowStep(definition.step, metadata)) {
          const expected = metadata?.currentStep ?? "01-init";
          ctx?.ui?.notify?.(`Paso fuera de orden. Ejecuta primero /pi:${expected}.`, "warning");
          return;
        }

        const updated = advanceWorkflowStep(definition.step, projectRoot);
        const message = buildGuideMessage(definition, updated.completedSteps);

        ctx?.ui?.notify?.(`${definition.description} ${definition.next}`, "info");
        if (typeof pi.sendMessage === "function") {
          pi.sendMessage({ customType: "orquestador-sdd-tdd", content: message, display: true });
        }
        if (typeof pi.sendUserMessage === "function") {
          pi.sendUserMessage(definition.prompt);
        }
      },
    });
  }

  pi.registerCommand("pi:99-doctor", {
    description: "Diagnostica el proyecto actual y aplica mantenimiento seguro del orquestador.",
    handler: async (_args: string, ctx: any) => {
      const projectRoot = ctx?.cwd ?? process.cwd();
      const report = runProjectDoctor(projectRoot);
      const message = buildDoctorMessage(report);

      ctx?.ui?.notify?.("Doctor del orquestador ejecutado. Revisa el reporte antes de seguir.", "info");
      sendGuidance(
        pi,
        "Resume el reporte de /pi:99-doctor en espanol. No modifiques codigo ni avances el flujo SDD salvo pedido explicito del usuario.",
        message,
      );
    },
  });

  pi.registerCommand("pi:99-migrate", {
    description: "Prepara convenciones seguras del orquestador en el proyecto actual.",
    handler: async (_args: string, ctx: any) => {
      const projectRoot = ctx?.cwd ?? process.cwd();
      const report = runProjectMigration(projectRoot);
      const message = buildMigrationMessage(report);

      ctx?.ui?.notify?.("Migracion segura del orquestador ejecutada. Revisa el reporte.", "info");
      sendGuidance(
        pi,
        "Resume el reporte de /pi:99-migrate en espanol. No avances el flujo SDD salvo pedido explicito del usuario.",
        message,
      );
    },
  });

  pi.registerCommand("pi:99-report", {
    description: "Genera un reporte versionable de validacion SDD/TDD del proyecto actual.",
    handler: async (_args: string, ctx: any) => {
      const projectRoot = ctx?.cwd ?? process.cwd();
      const report = runProjectValidationReport(projectRoot);
      const message = buildValidationReportMessage(report);

      ctx?.ui?.notify?.("Reporte de validacion generado. Revisa docs/sdd/99-reporte-validacion.md.", "info");
      sendGuidance(
        pi,
        "Resume el reporte de /pi:99-report en espanol. No avances el flujo SDD salvo pedido explicito del usuario.",
        message,
      );
    },
  });

  pi.registerCommand("pi:99-fix", {
    description: "Aplica correcciones guiadas a hallazgos del doctor.",
    handler: async (_args: string, ctx: any) => {
      const projectRoot = ctx?.cwd ?? process.cwd();
      const report = runProjectFix(projectRoot);
      const message = buildFixMessage(report);

      ctx?.ui?.notify?.("Correcciones guiadas ejecutadas. Revisa el reporte.", "info");
      sendGuidance(
        pi,
        "Resume el reporte de /pi:99-fix en espanol. No avances el flujo SDD salvo pedido explicito del usuario.",
        message,
      );
    },
  });

  pi.registerCommand("pi:99-version", {
    description: "Muestra la version instalada del orquestador y compara con GitHub.",
    handler: async (_args: string, ctx: any) => {
      let latest = "";
      let fetchError = "";
      try {
        const response = await fetch("https://api.github.com/repos/corbaz/orquestador-sdd-tdd/tags?per_page=1", {
          method: "GET",
          headers: { Accept: "application/vnd.github.v3+json", "User-Agent": "orquestador-sdd-tdd/1.6" },
        });
        if (response.ok) {
          const data = (await response.json()) as { name: string }[];
          if (data.length > 0) latest = data[0].name.replace(/^v/, "");
        } else if (response.status === 403 || response.status === 429) {
          fetchError = "límite de API de GitHub alcanzado (esperá un minuto)";
        } else if (response.status === 404) {
          fetchError = "repo privado — no se puede verificar sin token";
        } else {
          fetchError = `GitHub respondió ${response.status}`;
        }
      } catch (err) {
        fetchError = String(err).slice(0, 80);
      }

      const message = buildVersionMessage(ORCHESTRATOR_VERSION, latest, fetchError);
      ctx?.ui?.notify?.(`Orquestador version ${ORCHESTRATOR_VERSION}${latest ? ` (ultimo: ${latest})` : fetchError ? ` (${fetchError})` : ""}`, "info");
      sendGuidance(pi, message, message);
    },
  });

  pi.registerCommand("pi:99-ayuda", {
    description: "Muestra todos los comandos del orquestador con descripciones.",
    handler: async (_args: string, ctx: any) => {
      const message = buildAyudaText(ORCHESTRATOR_VERSION);
      ctx?.ui?.notify?.("Comandos del orquestador:", "info");
      sendGuidance(pi, message, message);
    },
  });
}

function buildBannerText(v: string, root?: string): string {
  const C: Record<string, string> = {
    r: "\x1b[0m",
    c: "\x1b[36m",
    g: "\x1b[32m",
    b: "\x1b[34m",
    y: "\x1b[90m",
    B: "\x1b[1m",
  };
  return [
    `${C.y}  ───────────────────────────────────────────────${C.r}`,
    `  ${C.c}${C.B}Orquestador SDD/TDD v${v}${C.r}`,
    `  ${C.y}Directorio: ${root ?? process.cwd()}${C.r}`,
    `${C.y}  ───────────────────────────────────────────────${C.r}`,
    `  ${C.c}FLUJO PRINCIPAL${C.r}`,
    `  ${C.g}/pi:01-init${C.r}     Iniciar el flujo SDD/TDD`,
    `  ${C.g}/pi:02-discover${C.r} Relevar el proyecto`,
    `  ${C.g}/pi:03-propose${C.r}  Redactar propuesta`,
    `  ${C.g}/pi:04-spec${C.r}     Especificar requisitos`,
    `  ${C.g}/pi:05-design${C.r}   Disenar arquitectura`,
    `  ${C.g}/pi:06-tasks${C.r}    Planificar tareas`,
    `  ${C.g}/pi:07-apply${C.r}    Aplicar con TDD`,
    `  ${C.g}/pi:08-verify${C.r}   Verificar contra spec`,
    `  ${C.g}/pi:09-review${C.r}   Cerrar ciclo`,
    `${C.y}  ───────────────────────────────────────────────${C.r}`,
    `  ${C.c}AUXILIARES${C.r}`,
    `  ${C.b}/pi:99-doctor${C.r}   Diagnosticar el proyecto`,
    `  ${C.b}/pi:99-migrate${C.r}  Preparar convenciones`,
    `  ${C.b}/pi:99-report${C.r}   Generar evidencia`,
    `  ${C.b}/pi:99-fix${C.r}      Auto-corregir hallazgos`,
    `  ${C.b}/pi:99-version${C.r}  Mostrar version`,
    `  ${C.b}/pi:99-ayuda${C.r}    Mostrar todos los comandos`,
    `${C.y}  ───────────────────────────────────────────────${C.r}`,
  ].join("\n");
}

function buildAyudaText(v: string): string {
  return [
    `# Orquestador SDD/TDD v${v}`,
    "",
    "## FLUJO PRINCIPAL",
    "| Comando | Que hace el agente |",
    "| --- | --- |",
    "| \`/pi:01-init\` | Pregunta cual es el objetivo y prepara el proyecto |",
    "| \`/pi:02-discover\` | Analiza el codigo y muestra lo que encontro |",
    "| \`/pi:03-propose\` | Pregunta problema, alcance y riesgos; escribe la propuesta |",
    "| \`/pi:04-spec\` | Pregunta requisitos MUST/SHOULD y escenarios; escribe la spec |",
    "| \`/pi:05-design\` | Pregunta decisiones tecnicas y escribe el diseno |",
    "| \`/pi:06-tasks\` | Pregunta el orden y genera tareas con TDD |",
    "| \`/pi:07-apply\` | Aplica las tareas con TDD en lotes pequenos |",
    "| \`/pi:08-verify\` | Verifica el resultado contra la especificacion |",
    "| \`/pi:09-review\` | Cierra el ciclo con evidencia final |",
    "",
    "## AUXILIARES",
    "| Comando | Descripcion |",
    "| --- | --- |",
    "| \`/pi:99-doctor\` | Diagnosticar el proyecto |",
    "| \`/pi:99-migrate\` | Preparar convenciones |",
    "| \`/pi:99-report\` | Generar evidencia |",
    "| \`/pi:99-fix\` | Auto-corregir hallazgos |",
    "| \`/pi:99-version\` | Mostrar version |",
    "| \`/pi:99-ayuda\` | Mostrar esta ayuda |",
    "",
  ].join("\n");
}

function buildGuideMessage(definition: CommandDefinition, completedSteps: WorkflowStep[]): string {
  const resumenes: Record<string, string> = {
    "01-init": "Se inicializo el flujo y se prepararon las convenciones del proyecto.",
    "02-discover": "Se relevo la estructura, tecnologias, riesgos y estado actual del proyecto.",
    "03-propose": "Se definio el problema, objetivo, alcance y riesgos del cambio.",
    "04-spec": "Se escribieron los requisitos MUST/SHOULD y escenarios de validacion.",
    "05-design": "Se documentaron componentes, contratos y decisiones de arquitectura.",
    "06-tasks": "Se dividio el trabajo en tareas implementables con TDD.",
    "07-apply": "Se aplicaron las tareas con TDD en lotes pequenos.",
    "08-verify": "Se verifico el resultado contra la especificacion.",
    "09-review": "Se cerro el ciclo con evidencia final.",
  };
  const resumen = resumenes[definition.step] ?? "";

  return [
    `## ${definition.command}`,
    "",
    `✅ ${resumen}`,
    "",
    `➡️ ${definition.next}`,
    "",
    `📋 Pasos completados: ${completedSteps.map((step) => `/pi:${step}`).join(", ") || "ninguno"}`,
    "",
    "💡 Ejecuta \`/pi:99-ayuda\` para ver todos los comandos.",
    "",
  ].join("\n");
}

function sendGuidance(pi: any, userPrompt: string, visibleMessage: string): void {
  if (typeof pi.sendMessage === "function") {
    pi.sendMessage({ customType: "orquestador-sdd-tdd", content: visibleMessage, display: true });
  }

  if (typeof pi.sendUserMessage === "function") {
    pi.sendUserMessage(userPrompt);
  }
}

function buildDoctorMessage(report: ProjectDoctorReport): string {
  const artifactLines = report.sddArtifacts.map(
    (artifact) => `- ${getArtifactStatus(artifact.exists, artifact.required)}: ${artifact.path}`,
  );
  const issueLines = report.issues.map((issue) => `- ${issue.severity.toUpperCase()} [${issue.code}]: ${issue.message}`);

  return [
    "# pi:99-doctor",
    "",
    "Diagnostico del proyecto actual y mantenimiento seguro del orquestador.",
    "",
    `Proyecto: ${report.projectRoot}`,
    `Git: ${report.gitRoot ?? "no detectado"}`,
    `Metadata del orquestador: ${report.hasMetadata ? "detectada" : "no detectada"}`,
    `Paso actual: ${report.currentStep ?? "sin iniciar"}`,
    `Pasos completados: ${report.completedSteps.map((step) => `/pi:${step}`).join(", ") || "ninguno"}`,
    "",
    "Mantenimiento seguro aplicado:",
    report.gitRoot
      ? `- .gitignore: ${report.addedGitignoreEntries.length > 0 ? `agregado ${report.addedGitignoreEntries.join(", ")}` : "sin cambios necesarios"}`
      : "- .gitignore: omitido porque no se detecto repositorio Git",
    "",
    "Artefactos SDD esperados:",
    ...artifactLines,
    "",
    "Hallazgos:",
    ...(issueLines.length > 0 ? issueLines : ["- Sin hallazgos pendientes."]),
    "",
    "Siguiente paso:",
    "- Si el reporte muestra faltantes, corregilos conscientemente o segui el flujo SDD correspondiente.",
    "- /pi:99-doctor no avanza pasos del flujo y no reemplaza /pi:01-init a /pi:06-tasks.",
    "",
  ].join("\n");
}

function getArtifactStatus(exists: boolean, required: boolean): string {
  if (required && exists) return "OK";
  if (required && !exists) return "Falta";
  if (!required && exists) return "Existe";
  return "No requerido";
}

function buildMigrationMessage(report: ProjectMigrationReport): string {
  return [
    "# pi:99-migrate",
    "",
    "Migracion segura de convenciones del orquestador.",
    "",
    `Proyecto: ${report.projectRoot}`,
    `Git: ${report.gitRoot ?? "no detectado"}`,
    "",
    "Cambios aplicados:",
    report.gitRoot
      ? `- .gitignore: ${report.addedGitignoreEntries.length > 0 ? `agregado ${report.addedGitignoreEntries.join(", ")}` : "sin cambios necesarios"}`
      : "- .gitignore: omitido porque no se detecto repositorio Git",
    `- docs/sdd/: ${report.docsSddCreated ? "creado" : "existente"}`,
    `- AGENTS.md: ${formatAgentsAction(report.agentsAction)}`,
    "",
    "Resultado del doctor posterior:",
    ...(report.doctor.issues.length > 0
      ? report.doctor.issues.map((issue) => `- ${issue.severity.toUpperCase()} [${issue.code}]: ${issue.message}`)
      : ["- Sin hallazgos pendientes."]),
    "",
    "Siguiente paso:",
    "- Revisar los cambios versionables antes de commitear en el proyecto usuario.",
    "- /pi:99-migrate no avanza pasos del flujo SDD/TDD.",
    "",
  ].join("\n");
}

function formatAgentsAction(action: ProjectMigrationReport["agentsAction"]): string {
  if (action === "created") return "creado";
  if (action === "updated") return "actualizado";
  return "sin cambios necesarios";
}

function buildFixMessage(report: ProjectFixReport): string {
  const fixLines = report.fixedIssues.map((issue) => `- FIXED [${issue.code}]: ${issue.message}`);
  const warnLines = report.unfixedWarnings.map((issue) => `- PENDIENTE [${issue.code}]: ${issue.message}`);

  return [
    "# pi:99-fix",
    "",
    "Correcciones guiadas aplicadas.",
    "",
    ...(fixLines.length > 0 ? fixLines : ["- Sin correcciones automaticas disponibles."]),
    "",
    ...(warnLines.length > 0
      ? ["Hallazgos que requieren atencion manual:", ...warnLines]
      : ["- Sin hallazgos pendientes."]),
    "",
    "Siguiente paso:",
    "- Revisar los cambios aplicados.",
    "- /pi:99-fix no avanza pasos del flujo SDD/TDD.",
    "",
  ].join("\n");
}

function buildVersionMessage(version: string, latest?: string, fetchError?: string): string {
  const updateLine = latest && latest !== version
    ? `\nActualizacion disponible: v${version} → v${latest}\nEjecuta: pi update git:github.com/corbaz/orquestador-sdd-tdd\n`
    : latest
    ? "\nEstas al dia.\n"
    : fetchError
    ? `\nNo se pudo verificar: ${fetchError}\n`
    : "\nNo se pudo verificar la ultima version (sin conexion?).\n";

  return [
    "# pi:99-version",
    "",
    `Orquestador SDD/TDD version ${version}${latest ? ` (ultimo: ${latest})` : ""}`,
    updateLine,
    "Comandos disponibles:",
    "- Flujo: /pi:01-init a /pi:09-review",
    "- Auxiliares: /pi:99-doctor, /pi:99-migrate, /pi:99-report, /pi:99-fix",
    "",
    "Documentacion: https://github.com/corbaz/orquestador-sdd-tdd",
    "",
  ].join("\n");
}

function buildValidationReportMessage(report: ProjectValidationReport): string {
  return [
    "# pi:99-report",
    "",
    "Reporte versionable de validacion SDD/TDD generado.",
    "",
    `Proyecto: ${report.projectRoot}`,
    `Archivo: ${report.reportPath}`,
    `Estado final: ${report.status}`,
    "",
    "Hallazgos:",
    ...(report.doctor.issues.length > 0
      ? report.doctor.issues.map((issue) => `- ${issue.severity.toUpperCase()} [${issue.code}]: ${issue.message}`)
      : ["- Sin hallazgos pendientes."]),
    "",
    "Siguiente paso:",
    "- Versionar el reporte si corresponde al proyecto usuario.",
    "- Si el estado es `bloqueado`, corregir antes de avanzar.",
    "- /pi:99-report no avanza pasos del flujo SDD/TDD.",
    "",
  ].join("\n");
}

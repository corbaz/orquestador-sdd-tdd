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
    description: "Inicializa el orquestador SDD/TDD y crea estado local minimo.",
    body: "Prepara el proyecto para trabajar con discovery, propuesta, especificacion, diseno y tareas.",
    next: "Siguiente paso: /pi:02-discover para relevar el proyecto y sus restricciones.",
    prompt: "Actua como orquestador SDD/TDD. Inicializa el flujo. PREGUNTA al usuario: '¿Cual es el objetivo de este cambio?' Espera su respuesta y registrala. Luego explica que el proximo paso es /pi:02-discover para relevar el proyecto.",
  },
  {
    step: "02-discover",
    command: "pi:02-discover",
    description: "Guia el discovery del proyecto antes de proponer cambios.",
    body: "Releva estructura, comandos disponibles, riesgos, convenciones y estado actual sin modificar codigo productivo.",
    next: "Siguiente paso: /pi:03-propose para redactar una propuesta acotada.",
    prompt: "Ejecuta discovery del proyecto. PREGUNTA al usuario: '¿Que cambio queres hacer?' si no lo definio antes. Releva estructura, comandos, riesgos, convenciones y estado actual. No implementes todavia. Al final, PREGUNTA: '¿Que objetivo concreto tiene este cambio?' y espera la respuesta antes de continuar.",
  },
  {
    step: "03-propose",
    command: "pi:03-propose",
    description: "Crea una propuesta SDD con alcance, motivacion y no-objetivos.",
    body: "Convierte el discovery en una propuesta revisable antes de escribir especificaciones.",
    next: "Siguiente paso: /pi:04-spec para definir requisitos y escenarios verificables.",
    prompt: "Redacta una propuesta SDD. PRIMERO: mostra al usuario el resumen del discovery y preguntale: '¿Este analisis refleja bien el estado del proyecto? ¿Falta algo que quieras agregar?' Iter hasta que diga 'si, esta bien'. DESPUES, empeza la propuesta. Para cada seccion: PRIMERO mostra lo que encontraste en el codigo con una frase tipo 'Esto es lo que identifique analizando el proyecto:' y lista tus hallazgos concretos. DESPUES pregunta '¿Queres agregar, modificar o quitar algo?' y espera su respuesta. Recien ahi pasa a la siguiente seccion. No mezcles hallazgos de codigo con sugerencias genericas sin aclarar. Al final mostra el resumen completo y preguntá '¿Queres modificar, agregar o quitar algo?' hasta que diga 'listo' o 'esta bien'.",
  },
  {
    step: "04-spec",
    command: "pi:04-spec",
    description: "Genera especificaciones SDD con requisitos y escenarios.",
    body: "Define comportamiento observable y criterios de aceptacion antes del diseno tecnico.",
    next: "Siguiente paso: /pi:05-design para decidir la arquitectura de implementacion.",
    prompt: "PRIMERO: mostrale al usuario la propuesta actual de docs/sdd/ y preguntale: '¿Esta propuesta esta completa para vos? ¿Queres modificar algo o agregar algo mas?' Si el usuario quiere cambios, ayudalo a modificar la propuesta iterando hasta que diga 'listo' o 'dale'. RECIEN DESPUES de su confirmacion, empeza a escribir la especificacion SDD. Para cada seccion usa el termino en ingles con su traduccion entre parentesis, ej: MUST (obligatorio), SHOULD (deseable). Para escenarios usa 'Dado que / Cuando / Entonces' en vez de 'Given/When/Then' para que sea mas claro en espanol. Para cada MUST, SHOULD y escenario: PRIMERO mostra tus propuestas basadas en el codigo con frases tipo 'Esto es lo que propongo segun el proyecto:' y lista tus ejemplos concretos. DESPUES pregunta '¿Agregamos este? ¿Queres modificarlo o proponer otro?' Itera hasta que confirme. Al final preguntale si quiere agregar mas.",
  },
  {
    step: "05-design",
    command: "pi:05-design",
    description: "Produce el diseno tecnico que implementara la especificacion.",
    body: "Documenta componentes, contratos, persistencia, riesgos y decisiones de arquitectura.",
    next: "Siguiente paso: /pi:06-tasks para partir el trabajo en tareas implementables.",
    prompt: "PRIMERO: mostra al usuario la especificacion actual y preguntale: '¿La especificacion esta completa? ¿Queres revisar o agregar algo antes de pasar al diseno?' Si pide cambios, ayudalo a modificar la especificacion. RECIEN DESPUES de su confirmacion, empeza el diseno. PROPONE cada decision basandote en el codigo existente. Por ejemplo: 'El frontend usa TanStack Router, el backend Hono, el editor se integraria en la pagina de plantillas. ¿Te parece bien este enfoque?' No preguntes en blanco. Para cada tema (componentes afectados, decisiones de arquitectura, contratos, testing, riesgos), proponé ejemplos concretos del proyecto, preguntá si esta bien, iterá hasta confirmar.",
  },
  {
    step: "06-tasks",
    command: "pi:06-tasks",
    description: "Divide el diseno en tareas concretas para aplicar con TDD cuando corresponda.",
    body: "Genera una lista ordenada de tareas, dependencias, validaciones y limites de revision.",
    next: "Siguiente paso: /pi:07-apply para aplicar las tareas con TDD en lotes pequenos.",
    prompt: "PRIMERO: mostra al usuario el diseno actual y preguntale: '¿El diseno esta completo? ¿Queres modificar algo antes de pasar a tareas?' Si pide cambios, ayudalo. RECIEN DESPUES de su confirmacion, genera las tareas. PREGUNTA: 1) '¿En que orden preferis implementar las tareas?' 2) '¿Cual es el tamano maximo de revision que te sentis comodo?' 3) '¿Preferis TDD estricto o aplicacion primero?' Genera las tareas con dependencias, validaciones y forecast. Muestra el resultado y pregunta si quiere ajustar algo.",
  },
  {
    step: "07-apply",
    command: "pi:07-apply",
    description: "Aplica las tareas con TDD en lotes pequenos y verifica cada paso.",
    body: "Implementa las tareas generadas en /pi:06-tasks, priorizando TDD y manteniendo trazabilidad con requisitos.",
    next: "Siguiente paso: /pi:08-verify para verificar el resultado contra la especificacion.",
    prompt: "Ejecuta las tareas del proyecto actual en orden, aplicando TDD. Revisa la especificacion, implementa, y documenta cada tarea completada. No saltes pasos de verificacion.",
  },
  {
    step: "08-verify",
    command: "pi:08-verify",
    description: "Verifica el resultado contra la especificacion SDD y los criterios de aceptacion.",
    body: "Revisa que el comportamiento implementado cumple los requisitos y escenarios definidos en /pi:04-spec.",
    next: "Siguiente paso: /pi:09-review para cerrar el ciclo y generar evidencia final.",
    prompt: "Verifica cada requisito y escenario de la especificacion contra el codigo/resultado actual. Documenta hallazgos, aprobaciones e incumplimientos.",
  },
  {
    step: "09-review",
    command: "pi:09-review",
    description: "Cierra el ciclo SDD generando evidencia final y resumen de validacion.",
    body: "Consolida los resultados de apply y verify en un reporte final versionable.",
    next: "Siguiente paso: el ciclo esta completo. Revisa docs/sdd/ para los artefactos finales.",
    prompt: "Genera un cierre del ciclo SDD con resumen de tareas aplicadas, verificacion de requisitos, evidencia de tests y recomendaciones finales. No introduzcas cambios nuevos.",
  },
];

export default function registerOrquestadorSddTdd(pi: ExtensionAPI): void {
  const lines = [
    "┌─────────────────────────────────────────────┐",
    `│  Orquestador SDD/TDD  v${ORCHESTRATOR_VERSION.padEnd(14)}│`,
    "│  /pi:01-init ... /pi:09-review             │",
    "│  /pi:99-doctor /pi:99-fix /pi:99-report    │",
    "└─────────────────────────────────────────────┘",
  ];
  console.log(lines.join("\n"));

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
        sendGuidance(pi, definition.prompt, message);
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
}

function buildGuideMessage(definition: CommandDefinition, completedSteps: WorkflowStep[]): string {
  return [
    `# ${definition.command}`,
    "",
    definition.description,
    "",
    `Que hace: ${definition.body}`,
    "",
    definition.next,
    "",
    `Pasos completados: ${completedSteps.map((step) => `/pi:${step}`).join(", ") || "ninguno"}`,
    "",
    "Guia para el agente:",
    definition.prompt,
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

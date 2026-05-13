import fs from "node:fs";
import path from "node:path";
import {
  getGlobalDatabasePath,
  getGlobalSchemaPath,
  getGlobalStateDir,
  getLocalDatabasePath,
  getLocalMetadataPath,
  getLocalSchemaPath,
  getProjectStateDir,
  PACKAGE_ID,
} from "./paths.ts";

export type WorkflowStep =
  | "01-init"
  | "02-discover"
  | "03-propose"
  | "04-spec"
  | "05-design"
  | "06-tasks";

export type ProjectMetadata = {
  packageId: string;
  projectRoot: string;
  currentStep: WorkflowStep | null;
  completedSteps: WorkflowStep[];
  updatedAt: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  "01-init",
  "02-discover",
  "03-propose",
  "04-spec",
  "05-design",
  "06-tasks",
];

export const DEFAULT_GITIGNORE_ENTRIES = [".pi/", ".DS_Store"];

export const SDD_ARTIFACTS: { step: WorkflowStep; path: string; label: string }[] = [
  { step: "03-propose", path: "docs/sdd/03-propuesta.md", label: "Propuesta SDD" },
  { step: "04-spec", path: "docs/sdd/04-especificacion.md", label: "Especificacion SDD" },
  { step: "05-design", path: "docs/sdd/05-diseno.md", label: "Diseno tecnico" },
  { step: "06-tasks", path: "docs/sdd/06-tareas.md", label: "Tareas SDD/TDD" },
];

export type ProjectDoctorIssue = {
  severity: "warning" | "fixed" | "error";
  code: string;
  message: string;
};

export type ProjectDoctorArtifact = {
  step: WorkflowStep;
  path: string;
  label: string;
  exists: boolean;
  required: boolean;
};

type SddDocumentSet = {
  proposal: string;
  spec: string;
  design: string;
  tasks: string;
};

export type ProjectDoctorReport = {
  projectRoot: string;
  gitRoot: string | null;
  gitignorePath: string | null;
  addedGitignoreEntries: string[];
  existingGitignoreEntries: string[];
  hasMetadata: boolean;
  currentStep: WorkflowStep | null;
  completedSteps: WorkflowStep[];
  docsSddExists: boolean;
  sddArtifacts: ProjectDoctorArtifact[];
  issues: ProjectDoctorIssue[];
};

export function createInitialSchemaSql(scope: "global" | "project"): string {
  return [
    "-- orquestador-sdd-tdd MVP schema",
    `-- scope: ${scope}`,
    "-- SQLite runtime is optional in MVP 1.",
    "-- If a SQLite adapter is installed later, execute this SQL against the paths documented below.",
    "",
    "CREATE TABLE IF NOT EXISTS workflow_events (",
    "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
    "  project_root TEXT,",
    "  step TEXT NOT NULL,",
    "  event_type TEXT NOT NULL,",
    "  payload_json TEXT NOT NULL DEFAULT '{}',",
    "  created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS workflow_state (",
    "  project_root TEXT PRIMARY KEY,",
    "  current_step TEXT,",
    "  completed_steps_json TEXT NOT NULL DEFAULT '[]',",
    "  updated_at TEXT NOT NULL DEFAULT (datetime('now'))",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS session_snapshots (",
    "  id INTEGER PRIMARY KEY AUTOINCREMENT,",
    "  project_root TEXT,",
    "  event_type TEXT NOT NULL,",
    "  summary TEXT NOT NULL DEFAULT '',",
    "  payload_json TEXT NOT NULL DEFAULT '{}',",
    "  created_at TEXT NOT NULL DEFAULT (datetime('now'))",
    ");",
    "",
  ].join("\n");
}

export function ensurePersistenceFiles(projectRoot = process.cwd()): ProjectMetadata {
  const globalDir = getGlobalStateDir();
  const projectDir = getProjectStateDir(projectRoot);

  fs.mkdirSync(globalDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  writeIfMissing(getGlobalSchemaPath(), createInitialSchemaSql("global"));
  writeIfMissing(getLocalSchemaPath(projectRoot), createInitialSchemaSql("project"));
  writeIfMissing(getGlobalDatabasePath(), "");
  writeIfMissing(getLocalDatabasePath(projectRoot), "");
  ensureProjectGitignoreEntries(projectRoot);

  const metadata = readProjectMetadata(projectRoot) ?? createEmptyMetadata(projectRoot);
  writeProjectMetadata(metadata, projectRoot);
  return metadata;
}

export function readProjectMetadata(projectRoot = process.cwd()): ProjectMetadata | null {
  const metadataPath = getLocalMetadataPath(projectRoot);
  if (!fs.existsSync(metadataPath)) return null;

  try {
    const parsed = JSON.parse(fs.readFileSync(metadataPath, "utf8")) as ProjectMetadata;
    return {
      packageId: parsed.packageId ?? PACKAGE_ID,
      projectRoot: parsed.projectRoot ?? projectRoot,
      currentStep: parsed.currentStep ?? null,
      completedSteps: Array.isArray(parsed.completedSteps) ? parsed.completedSteps : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writeProjectMetadata(metadata: ProjectMetadata, projectRoot = process.cwd()): void {
  fs.mkdirSync(path.dirname(getLocalMetadataPath(projectRoot)), { recursive: true });
  fs.writeFileSync(getLocalMetadataPath(projectRoot), `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}

export function canRunWorkflowStep(step: WorkflowStep, metadata: ProjectMetadata | null): boolean {
  if (step === "01-init") return true;
  if (!metadata) return false;

  const expectedPrevious = WORKFLOW_STEPS[WORKFLOW_STEPS.indexOf(step) - 1];
  return metadata.completedSteps.includes(expectedPrevious);
}

export function advanceWorkflowStep(step: WorkflowStep, projectRoot = process.cwd()): ProjectMetadata {
  const metadata = readProjectMetadata(projectRoot) ?? createEmptyMetadata(projectRoot);
  const completedSteps = new Set(metadata.completedSteps);
  completedSteps.add(step);

  const nextIndex = WORKFLOW_STEPS.indexOf(step) + 1;
  const nextStep = WORKFLOW_STEPS[nextIndex] ?? step;
  const updated: ProjectMetadata = {
    ...metadata,
    currentStep: nextStep,
    completedSteps: [...completedSteps],
    updatedAt: new Date().toISOString(),
  };
  writeProjectMetadata(updated, projectRoot);
  return updated;
}

export function createEmptyMetadata(projectRoot = process.cwd()): ProjectMetadata {
  return {
    packageId: PACKAGE_ID,
    projectRoot,
    currentStep: null,
    completedSteps: [],
    updatedAt: new Date().toISOString(),
  };
}

export function runProjectDoctor(projectRoot = process.cwd()): ProjectDoctorReport {
  const gitRoot = findGitRoot(projectRoot);
  const gitignoreResult = gitRoot ? ensureGitignoreEntries(gitRoot, DEFAULT_GITIGNORE_ENTRIES) : null;
  const metadata = readProjectMetadata(projectRoot);
  const completedSteps = metadata?.completedSteps ?? [];
  const sddArtifacts = SDD_ARTIFACTS.map((artifact) => ({
    ...artifact,
    exists: fs.existsSync(path.join(projectRoot, artifact.path)),
    required: completedSteps.includes(artifact.step),
  }));
  const documents = readSddDocuments(projectRoot);
  const issues = [
    ...buildDoctorIssues(gitRoot, gitignoreResult?.addedEntries ?? [], metadata, sddArtifacts),
    ...buildCoherenceIssues(documents, sddArtifacts),
  ];

  return {
    projectRoot,
    gitRoot,
    gitignorePath: gitignoreResult?.gitignorePath ?? null,
    addedGitignoreEntries: gitignoreResult?.addedEntries ?? [],
    existingGitignoreEntries: gitignoreResult?.existingEntries ?? [],
    hasMetadata: metadata !== null,
    currentStep: metadata?.currentStep ?? null,
    completedSteps,
    docsSddExists: fs.existsSync(path.join(projectRoot, "docs", "sdd")),
    sddArtifacts,
    issues,
  };
}

function readSddDocuments(projectRoot: string): SddDocumentSet {
  return {
    proposal: readTextIfExists(path.join(projectRoot, "docs", "sdd", "03-propuesta.md")),
    spec: readTextIfExists(path.join(projectRoot, "docs", "sdd", "04-especificacion.md")),
    design: readTextIfExists(path.join(projectRoot, "docs", "sdd", "05-diseno.md")),
    tasks: readTextIfExists(path.join(projectRoot, "docs", "sdd", "06-tareas.md")),
  };
}

function readTextIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function buildCoherenceIssues(documents: SddDocumentSet, artifacts: ProjectDoctorArtifact[]): ProjectDoctorIssue[] {
  const issues: ProjectDoctorIssue[] = [];
  const specRequired = artifacts.some((artifact) => artifact.step === "04-spec" && artifact.required && artifact.exists);
  const designRequired = artifacts.some((artifact) => artifact.step === "05-design" && artifact.required && artifact.exists);
  const tasksRequired = artifacts.some((artifact) => artifact.step === "06-tasks" && artifact.required && artifact.exists);

  if (designRequired && !documents.design.includes("04-especificacion.md")) {
    issues.push({
      severity: "warning",
      code: "sdd-reference-missing",
      message: "El diseno no referencia `docs/sdd/04-especificacion.md`.",
    });
  }

  if (tasksRequired && !documents.tasks.includes("05-diseno.md")) {
    issues.push({
      severity: "warning",
      code: "sdd-reference-missing",
      message: "Las tareas no referencian `docs/sdd/05-diseno.md`.",
    });
  }

  if (specRequired && designRequired) {
    for (const requirement of extractMustRequirements(documents.spec)) {
      if (!documentCoversRequirement(documents.design, requirement)) {
        issues.push({
          severity: "warning",
          code: "sdd-design-coverage-missing",
          message: `El requisito MUST ${requirement} no aparece referenciado en el diseno.`,
        });
      }
    }
  }

  if (specRequired && tasksRequired) {
    for (const requirement of extractMustRequirements(documents.spec)) {
      if (!documentCoversRequirement(documents.tasks, requirement)) {
        issues.push({
          severity: "warning",
          code: "sdd-task-coverage-missing",
          message: `El requisito MUST ${requirement} no aparece cubierto en las tareas.`,
        });
      }
    }
  }

  for (const conflict of findOutOfScopeConflicts(documents.proposal, [documents.design, documents.tasks].join("\n"))) {
    issues.push({
      severity: "error",
      code: "sdd-out-of-scope-conflict",
      message: conflict,
    });
  }

  return issues;
}

function documentCoversRequirement(document: string, requirement: string): boolean {
  if (document.includes(requirement)) return true;

  const requirementNumber = Number(requirement.match(/RQ-(\d{3})/)?.[1]);
  if (!Number.isFinite(requirementNumber)) return false;

  for (const match of document.matchAll(/RQ-(\d{3})\s*(?:a|to|-)\s*RQ-(\d{3})/gi)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (requirementNumber >= start && requirementNumber <= end) return true;
  }

  return false;
}

function extractMustRequirements(spec: string): string[] {
  const lines = spec.split(/\r?\n/);
  const requirements: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const id = lines[index].match(/\bRQ-\d{3}\b/)?.[0];
    if (!id) continue;

    const window = lines.slice(index, index + 8).join("\n");
    if (/\*\*Prioridad:\*\*\s*MUST/i.test(window) || /Prioridad:\s*MUST/i.test(window)) {
      requirements.push(id);
    }
  }

  return [...new Set(requirements)];
}

function findOutOfScopeConflicts(proposal: string, downstream: string): string[] {
  const topics = extractOutOfScopeTopics(proposal);
  const downstreamLines = downstream.split(/\r?\n/);
  const conflicts: string[] = [];

  for (const topic of topics) {
    const line = downstreamLines.find((candidate) => lineIntroducesTopic(candidate, topic));
    if (line) {
      conflicts.push(`Tema fuera de alcance reaparece como trabajo activo: "${topic}" en "${line.trim()}".`);
    }
  }

  return conflicts;
}

function extractOutOfScopeTopics(proposal: string): string[] {
  const section = extractSection(proposal, /##\s+\d*\.?\s*Fuera de alcance/i);
  const rawTopics = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .flatMap((line) => extractKnownTopics(line));

  return [...new Set(rawTopics)];
}

function extractSection(markdown: string, headingPattern: RegExp): string {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start === -1) return "";

  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  return lines.slice(start + 1, next === -1 ? lines.length : next).join("\n");
}

function extractKnownTopics(line: string): string[] {
  const normalized = line.toLowerCase();
  const topics: string[] = [];
  const knownTopics = [
    { token: "sqlite", label: "SQLite" },
    { token: "ci/cd", label: "CI/CD" },
    { token: "github actions", label: "GitHub Actions" },
    { token: "interfaz grafica", label: "interfaz grafica" },
    { token: "aplicacion productiva", label: "aplicacion productiva" },
    { token: "integraciones externas", label: "integraciones externas" },
    { token: "servicios remotos", label: "servicios remotos" },
  ];

  for (const topic of knownTopics) {
    if (normalized.includes(topic.token)) topics.push(topic.label);
  }

  return topics;
}

function lineIntroducesTopic(line: string, topic: string): boolean {
  const normalized = line.toLowerCase();
  const normalizedTopic = topic.toLowerCase();
  const hasTopic = normalized.includes(normalizedTopic) || (normalizedTopic === "ci/cd" && normalized.includes("github actions"));
  if (!hasTopic) return false;
  if (/\b(no|sin|fuera de alcance|no se incluye|no debe|queda fuera)\b/i.test(line)) return false;

  return /\b(implementar|crear|agregar|anadir|añadir|requerir|obligatorio|must|configurar|introducir)\b/i.test(line);
}

function buildDoctorIssues(
  gitRoot: string | null,
  addedGitignoreEntries: string[],
  metadata: ProjectMetadata | null,
  sddArtifacts: ProjectDoctorArtifact[],
): ProjectDoctorIssue[] {
  const issues: ProjectDoctorIssue[] = [];

  if (!gitRoot) {
    issues.push({
      severity: "warning",
      code: "git-not-detected",
      message: "No se detecto repositorio Git; no se aplicaron ignores automaticos.",
    });
  }

  for (const entry of addedGitignoreEntries) {
    issues.push({
      severity: "fixed",
      code: "gitignore-entry-added",
      message: `Se agrego ${entry} a .gitignore.`,
    });
  }

  if (!metadata) {
    issues.push({
      severity: "warning",
      code: "metadata-missing",
      message: "No se detecto metadata del orquestador; ejecuta /pi:01-init si queres iniciar el flujo.",
    });
  }

  for (const artifact of sddArtifacts) {
    if (artifact.required && !artifact.exists) {
      issues.push({
        severity: "warning",
        code: "sdd-artifact-missing",
        message: `Falta ${artifact.path}, requerido porque ${artifact.step} figura como completado.`,
      });
    }
  }

  return issues;
}

function writeIfMissing(filePath: string, contents: string): void {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function ensureProjectGitignoreEntries(projectRoot: string): void {
  const gitRoot = findGitRoot(projectRoot);
  if (!gitRoot) return;

  ensureGitignoreEntries(gitRoot, DEFAULT_GITIGNORE_ENTRIES);
}

function ensureGitignoreEntries(gitRoot: string, entries: string[]): {
  gitignorePath: string;
  addedEntries: string[];
  existingEntries: string[];
} {
  const gitignorePath = path.join(gitRoot, ".gitignore");
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  const addedEntries = entries.filter((entry) => !hasGitignoreEntry(lines, entry));
  const existingEntries = entries.filter((entry) => hasGitignoreEntry(lines, entry));

  if (addedEntries.length === 0) {
    return { gitignorePath, addedEntries, existingEntries };
  }

  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(gitignorePath, `${existing}${prefix}${addedEntries.join("\n")}\n`, "utf8");
  return { gitignorePath, addedEntries, existingEntries };
}

function hasGitignoreEntry(lines: string[], entry: string): boolean {
  if (entry === ".pi/") return lines.includes(".pi/") || lines.includes(".pi");
  return lines.includes(entry);
}

function findGitRoot(startDir: string): string | null {
  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, ".git"))) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

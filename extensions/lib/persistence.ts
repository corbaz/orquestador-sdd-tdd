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
  ensureLocalStateIgnored(projectRoot);

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

function writeIfMissing(filePath: string, contents: string): void {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function ensureLocalStateIgnored(projectRoot: string): void {
  const gitRoot = findGitRoot(projectRoot);
  if (!gitRoot) return;

  const gitignorePath = path.join(gitRoot, ".gitignore");
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, "utf8") : "";
  const lines = existing.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(".pi/") || lines.includes(".pi")) return;

  const prefix = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(gitignorePath, `${existing}${prefix}.pi/\n`, "utf8");
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

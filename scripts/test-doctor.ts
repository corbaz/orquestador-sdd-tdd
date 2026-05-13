import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runProjectDoctor, runProjectMigration, writeProjectMetadata } from "../extensions/lib/persistence.ts";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "orquestador-doctor-test-"));

try {
  testGitignoreMaintenance();
  testNonGitProject();
  testArtifactRequirementsFollowCompletedSteps();
  testRequirementCoverageAcrossDesignAndTasks();
  testRequirementRangeCoverage();
  testOutOfScopeConflictDetection();
  testProjectMigrationCreatesConventions();
  console.log("Doctor validation OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function testGitignoreMaintenance(): void {
  const projectRoot = createProject("gitignore-maintenance", true);

  const firstReport = runProjectDoctor(projectRoot);
  assert.deepEqual(firstReport.addedGitignoreEntries, [".pi/", ".DS_Store"]);
  assert.equal(fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf8"), ".pi/\n.DS_Store\n");
  assert.equal(firstReport.issues.filter((issue) => issue.code === "gitignore-entry-added").length, 2);

  const secondReport = runProjectDoctor(projectRoot);
  assert.deepEqual(secondReport.addedGitignoreEntries, []);
  assert.deepEqual(secondReport.existingGitignoreEntries, [".pi/", ".DS_Store"]);
  assert.equal(secondReport.issues.some((issue) => issue.code === "gitignore-entry-added"), false);
}

function testNonGitProject(): void {
  const projectRoot = createProject("non-git", false);
  const report = runProjectDoctor(projectRoot);

  assert.equal(report.gitRoot, null);
  assert.equal(fs.existsSync(path.join(projectRoot, ".gitignore")), false);
  assert.equal(report.issues.some((issue) => issue.code === "git-not-detected"), true);
}

function testArtifactRequirementsFollowCompletedSteps(): void {
  const projectRoot = createProject("artifact-requirements", true);
  writeProjectMetadata(
    {
      packageId: "orquestador-sdd-tdd",
      projectRoot,
      currentStep: "04-spec",
      completedSteps: ["01-init", "02-discover", "03-propose"],
      updatedAt: new Date().toISOString(),
    },
    projectRoot,
  );

  const missingReport = runProjectDoctor(projectRoot);
  assert.equal(missingReport.sddArtifacts.find((artifact) => artifact.step === "03-propose")?.required, true);
  assert.equal(missingReport.sddArtifacts.find((artifact) => artifact.step === "04-spec")?.required, false);
  assert.equal(missingReport.issues.some((issue) => issue.code === "sdd-artifact-missing"), true);

  const docsDir = path.join(projectRoot, "docs", "sdd");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "03-propuesta.md"), "# Propuesta\n", "utf8");

  const fixedReport = runProjectDoctor(projectRoot);
  assert.equal(fixedReport.issues.some((issue) => issue.code === "sdd-artifact-missing"), false);
}

function testRequirementCoverageAcrossDesignAndTasks(): void {
  const projectRoot = createProject("requirement-coverage", true);
  writeProjectMetadata(
    {
      packageId: "orquestador-sdd-tdd",
      projectRoot,
      currentStep: "06-tasks",
      completedSteps: ["01-init", "02-discover", "03-propose", "04-spec", "05-design", "06-tasks"],
      updatedAt: new Date().toISOString(),
    },
    projectRoot,
  );
  writeSddArtifacts(projectRoot, {
    proposal: "# Propuesta\n",
    spec: "# Spec\n\n### RQ-001 - Estado\n\n**Prioridad:** MUST\n\n### RQ-002 - Opcional\n\n**Prioridad:** SHOULD\n",
    design: "# Diseno\n\nReferencia a docs/sdd/04-especificacion.md y RQ-001.\n",
    tasks: "# Tareas\n\nReferencia a docs/sdd/05-diseno.md y RQ-001.\n",
  });

  const report = runProjectDoctor(projectRoot);
  assert.equal(report.issues.some((issue) => issue.code === "sdd-design-coverage-missing"), false);
  assert.equal(report.issues.some((issue) => issue.code === "sdd-task-coverage-missing"), false);

  fs.writeFileSync(path.join(projectRoot, "docs", "sdd", "06-tareas.md"), "# Tareas\n\nReferencia a docs/sdd/05-diseno.md.\n", "utf8");
  const missingReport = runProjectDoctor(projectRoot);
  assert.equal(missingReport.issues.some((issue) => issue.code === "sdd-task-coverage-missing"), true);
}

function testRequirementRangeCoverage(): void {
  const projectRoot = createProject("requirement-range-coverage", true);
  writeProjectMetadata(
    {
      packageId: "orquestador-sdd-tdd",
      projectRoot,
      currentStep: "06-tasks",
      completedSteps: ["01-init", "02-discover", "03-propose", "04-spec", "05-design", "06-tasks"],
      updatedAt: new Date().toISOString(),
    },
    projectRoot,
  );
  writeSddArtifacts(projectRoot, {
    proposal: "# Propuesta\n",
    spec: "# Spec\n\n### RQ-001\n\n**Prioridad:** MUST\n\n### RQ-002\n\n**Prioridad:** MUST\n\n### RQ-003\n\n**Prioridad:** MUST\n",
    design: "# Diseno\n\nReferencia a docs/sdd/04-especificacion.md. Cobertura RQ-001 a RQ-003.\n",
    tasks: "# Tareas\n\nReferencia a docs/sdd/05-diseno.md. Cobertura RQ-001 a RQ-003.\n",
  });

  const report = runProjectDoctor(projectRoot);
  assert.equal(report.issues.some((issue) => issue.code === "sdd-design-coverage-missing"), false);
  assert.equal(report.issues.some((issue) => issue.code === "sdd-task-coverage-missing"), false);
}

function testOutOfScopeConflictDetection(): void {
  const projectRoot = createProject("out-of-scope-conflict", true);
  writeProjectMetadata(
    {
      packageId: "orquestador-sdd-tdd",
      projectRoot,
      currentStep: "06-tasks",
      completedSteps: ["01-init", "02-discover", "03-propose", "04-spec", "05-design", "06-tasks"],
      updatedAt: new Date().toISOString(),
    },
    projectRoot,
  );
  writeSddArtifacts(projectRoot, {
    proposal: "# Propuesta\n\n## 4. Fuera de alcance\n\n- Implementar SQLite real.\n- Crear CI/CD.\n",
    spec: "# Spec\n\n### RQ-001\n\n**Prioridad:** MUST\n",
    design: "# Diseno\n\nReferencia a docs/sdd/04-especificacion.md y RQ-001.\n\nNo se incluye SQLite real.\n",
    tasks: "# Tareas\n\nReferencia a docs/sdd/05-diseno.md y RQ-001.\n\n- Implementar SQLite real.\n",
  });

  const report = runProjectDoctor(projectRoot);
  assert.equal(report.issues.some((issue) => issue.code === "sdd-out-of-scope-conflict" && issue.severity === "error"), true);
}

function testProjectMigrationCreatesConventions(): void {
  const projectRoot = createProject("project-migration", true);
  fs.writeFileSync(path.join(projectRoot, "AGENTS.md"), "# Existing\n", "utf8");

  const report = runProjectMigration(projectRoot);
  assert.deepEqual(report.addedGitignoreEntries, [".pi/", ".DS_Store"]);
  assert.equal(report.docsSddCreated, true);
  assert.equal(report.agentsAction, "updated");
  assert.equal(fs.existsSync(path.join(projectRoot, "docs", "sdd")), true);

  const agents = fs.readFileSync(path.join(projectRoot, "AGENTS.md"), "utf8");
  assert.equal(agents.includes("# Existing"), true);
  assert.equal(agents.includes("orquestador-sdd-tdd:start"), true);
  assert.equal(agents.includes("/pi:99-doctor"), true);

  const secondReport = runProjectMigration(projectRoot);
  assert.deepEqual(secondReport.addedGitignoreEntries, []);
  assert.equal(secondReport.docsSddCreated, false);
  assert.equal(secondReport.agentsAction, "unchanged");
}

function createProject(name: string, withGit: boolean): string {
  const projectRoot = path.join(tempRoot, name);
  fs.mkdirSync(projectRoot, { recursive: true });
  if (withGit) fs.mkdirSync(path.join(projectRoot, ".git"));
  return projectRoot;
}

function writeSddArtifacts(
  projectRoot: string,
  contents: { proposal: string; spec: string; design: string; tasks: string },
): void {
  const docsDir = path.join(projectRoot, "docs", "sdd");
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, "03-propuesta.md"), contents.proposal, "utf8");
  fs.writeFileSync(path.join(docsDir, "04-especificacion.md"), contents.spec, "utf8");
  fs.writeFileSync(path.join(docsDir, "05-diseno.md"), contents.design, "utf8");
  fs.writeFileSync(path.join(docsDir, "06-tareas.md"), contents.tasks, "utf8");
}

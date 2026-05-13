import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runProjectDoctor, writeProjectMetadata } from "../extensions/lib/persistence.ts";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "orquestador-doctor-test-"));

try {
  testGitignoreMaintenance();
  testNonGitProject();
  testArtifactRequirementsFollowCompletedSteps();
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

function createProject(name: string, withGit: boolean): string {
  const projectRoot = path.join(tempRoot, name);
  fs.mkdirSync(projectRoot, { recursive: true });
  if (withGit) fs.mkdirSync(path.join(projectRoot, ".git"));
  return projectRoot;
}

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  advanceWorkflowStep,
  canRunWorkflowStep,
  ensurePersistenceFiles,
  readProjectMetadata,
  WORKFLOW_STEPS,
  type WorkflowStep,
} from "../extensions/lib/persistence.ts";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "orquestador-workflow-test-"));

try {
  testInitialPersistenceFiles();
  testWorkflowOrdering();
  testWorkflowAdvancementIsIdempotent();
  console.log("Workflow validation OK");
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}

function testInitialPersistenceFiles(): void {
  const projectRoot = createProject("initial-persistence");
  const metadata = ensurePersistenceFiles(projectRoot);

  assert.equal(metadata.packageId, "orquestador-sdd-tdd");
  assert.equal(metadata.currentStep, null);
  assert.deepEqual(metadata.completedSteps, []);
  assert.equal(fs.existsSync(path.join(projectRoot, ".pi", "orquestador-sdd-tdd", "metadata.json")), true);
  assert.equal(fs.existsSync(path.join(projectRoot, ".pi", "orquestador-sdd-tdd", "schema.sql")), true);
  assert.equal(fs.readFileSync(path.join(projectRoot, ".gitignore"), "utf8"), ".pi/\n.DS_Store\n");
}

function testWorkflowOrdering(): void {
  const projectRoot = createProject("workflow-ordering");
  ensurePersistenceFiles(projectRoot);

  assert.equal(canRunWorkflowStep("01-init", readProjectMetadata(projectRoot)), true);
  assert.equal(canRunWorkflowStep("02-discover", readProjectMetadata(projectRoot)), false);

  advanceWorkflowStep("01-init", projectRoot);
  assert.equal(canRunWorkflowStep("02-discover", readProjectMetadata(projectRoot)), true);
  assert.equal(canRunWorkflowStep("03-propose", readProjectMetadata(projectRoot)), false);
}

function testWorkflowAdvancementIsIdempotent(): void {
  const projectRoot = createProject("workflow-advancement");
  ensurePersistenceFiles(projectRoot);

  for (const step of WORKFLOW_STEPS) {
    advanceWorkflowStep(step, projectRoot);
  }

  advanceWorkflowStep("06-tasks", projectRoot);
  const metadata = readProjectMetadata(projectRoot);
  assert.equal(metadata?.currentStep, "06-tasks");
  assert.deepEqual(metadata?.completedSteps, WORKFLOW_STEPS satisfies WorkflowStep[]);
}

function createProject(name: string): string {
  const projectRoot = path.join(tempRoot, name);
  fs.mkdirSync(path.join(projectRoot, ".git"), { recursive: true });
  return projectRoot;
}

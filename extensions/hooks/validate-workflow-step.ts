import {
  canRunWorkflowStep,
  readProjectMetadata,
  type WorkflowStep,
  WORKFLOW_STEPS,
} from "../lib/persistence.ts";

export function parsePiWorkflowCommand(command: string): WorkflowStep | null {
  const normalized = command.replace(/^\//, "").replace(/^pi:/, "");
  return WORKFLOW_STEPS.includes(normalized as WorkflowStep) ? (normalized as WorkflowStep) : null;
}

export function validateWorkflowStep(command: string, projectRoot = process.cwd()): { allowed: boolean; reason?: string } {
  const step = parsePiWorkflowCommand(command);
  if (!step) return { allowed: true };

  const metadata = readProjectMetadata(projectRoot);
  if (canRunWorkflowStep(step, metadata)) return { allowed: true };

  const current = metadata?.currentStep ?? "01-init";
  return {
    allowed: false,
    reason: `El flujo SDD/TDD esta fuera de orden. Paso esperado: /pi:${current}. Paso recibido: /pi:${step}.`,
  };
}

export function registerValidateWorkflowStepHook(pi: any): void {
  pi.on?.("input", async (event: any, ctx: any) => {
    const command = event?.text ?? "";
    const result = validateWorkflowStep(command, ctx?.cwd ?? process.cwd());
    if (!result.allowed) {
      ctx?.ui?.notify?.(result.reason, "warning");
      return { action: "handled" };
    }
    return { action: "continue" };
  });
}

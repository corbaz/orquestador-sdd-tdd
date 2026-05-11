import fs from "node:fs";
import path from "node:path";
import { getProjectStateDir } from "../lib/paths.ts";
import { ensurePersistenceFiles } from "../lib/persistence.ts";

export type SessionEventType = "agent-start" | "agent-stop";

export function captureSessionEvent(eventType: SessionEventType, projectRoot = process.cwd(), payload: unknown = {}): void {
  ensurePersistenceFiles(projectRoot);
  const filePath = path.join(getProjectStateDir(projectRoot), "session-events.jsonl");
  const line = JSON.stringify({ eventType, projectRoot, payload, createdAt: new Date().toISOString() });
  fs.appendFileSync(filePath, `${line}\n`, "utf8");
}

export function registerCaptureSessionHook(pi: any): void {
  pi.on?.("agent_start", async (event: any, ctx: any) => {
    captureSessionEvent("agent-start", ctx?.cwd ?? process.cwd(), sanitizePayload(event ?? {}));
  });

  pi.on?.("agent_end", async (event: any, ctx: any) => {
    captureSessionEvent("agent-stop", ctx?.cwd ?? process.cwd(), sanitizePayload(event ?? {}));
  });
}

function sanitizePayload(payload: any): unknown {
  return {
    type: payload?.type,
    messageCount: Array.isArray(payload?.messages) ? payload.messages.length : undefined,
    timestamp: new Date().toISOString(),
  };
}

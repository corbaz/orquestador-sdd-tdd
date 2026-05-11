import fs from "node:fs";
import path from "node:path";
import { getProjectStateDir } from "../lib/paths.ts";
import { ensurePersistenceFiles } from "../lib/persistence.ts";

export function writeCompactionPlaceholder(projectRoot = process.cwd(), summary = ""): string {
  ensurePersistenceFiles(projectRoot);
  const filePath = path.join(getProjectStateDir(projectRoot), "context-summary.md");
  const content = [
    "# Contexto compacto",
    "",
    summary || "Pendiente: completar con el resumen operativo antes de compactar contexto.",
    "",
    `Actualizado: ${new Date().toISOString()}`,
    "",
  ].join("\n");
  fs.writeFileSync(filePath, content, "utf8");
  return filePath;
}

export function registerCompactContextHook(pi: any): void {
  pi.on?.("session_before_compact", async (event: any, ctx: any) => {
    const previous = event?.preparation?.previousSummary ?? "";
    const filePath = writeCompactionPlaceholder(ctx?.cwd ?? process.cwd(), previous);
    ctx?.ui?.notify?.(`Resumen de contexto guardado en ${filePath}`, "info");
    return undefined;
  });
}

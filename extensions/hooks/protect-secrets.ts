const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*[^\s]+/i,
  /password\s*[:=]\s*[^\s]+/i,
  /secret\s*[:=]\s*[^\s]+/i,
  /token\s*[:=]\s*[^\s]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
];

const DANGEROUS_COMMANDS = [
  /\brm\s+-rf\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\s+-fd\b/i,
  /\bRemove-Item\b.*\s-Recurse\b.*\s-Force\b/i,
];

export type GuardResult = {
  allowed: boolean;
  reason?: string;
};

export function inspectForSecretsOrDanger(input: unknown): GuardResult {
  const text = typeof input === "string" ? input : JSON.stringify(input ?? "");

  if (SECRET_PATTERNS.some((pattern) => pattern.test(text))) {
    return { allowed: false, reason: "Se detecto un posible secreto en el contenido." };
  }

  if (DANGEROUS_COMMANDS.some((pattern) => pattern.test(text))) {
    return { allowed: false, reason: "Se detecto un comando destructivo que requiere revision humana." };
  }

  return { allowed: true };
}

export function registerProtectSecretsHook(pi: any): void {
  pi.on?.("tool_call", async (event: any, ctx: any) => {
    const result = inspectForSecretsOrDanger(event?.input ?? event);
    if (!result.allowed) {
      ctx?.ui?.notify?.(result.reason, "error");
      return { block: true, reason: result.reason };
    }
    return undefined;
  });

  pi.on?.("user_bash", async (event: any, ctx: any) => {
    const result = inspectForSecretsOrDanger(event?.command ?? event);
    if (!result.allowed) {
      ctx?.ui?.notify?.(result.reason, "error");
      return {
        result: {
          output: result.reason ?? "Comando bloqueado por orquestador-sdd-tdd.",
          exitCode: 1,
          cancelled: false,
          truncated: false,
        },
      };
    }
    return undefined;
  });
}

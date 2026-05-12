import { existsSync, readdirSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

type PackageJson = {
  pi?: {
    extensions?: unknown;
    skills?: unknown;
    prompts?: unknown;
  };
};

const root = process.cwd();
const packageJsonPath = path.join(root, "package.json");
const orchestratorPath = path.join(root, "extensions", "orchestrator.ts");
const requiredCommands = [
  "pi:01-init",
  "pi:02-discover",
  "pi:03-propose",
  "pi:04-spec",
  "pi:05-design",
  "pi:06-tasks",
];

const failures: string[] = [];

function fail(message: string): void {
  failures.push(message);
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    fail(`package.json must define pi.${field} as an array.`);
    return [];
  }

  const invalid = value.filter((item) => typeof item !== "string");
  if (invalid.length > 0) {
    fail(`package.json pi.${field} must contain only string paths.`);
  }

  return value.filter((item): item is string => typeof item === "string");
}

function assertExists(relativePath: string, label: string): void {
  const absolutePath = path.resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${label} does not exist: ${relativePath}`);
  }
}

const packageJson = JSON.parse(await Bun.file(packageJsonPath).text()) as PackageJson;

if (!packageJson.pi) {
  fail("package.json must define a pi manifest.");
}

if (packageJson.pi && "prompts" in packageJson.pi) {
  fail("package.json must not register pi.prompts in MVP1.");
}

const extensions = asStringArray(packageJson.pi?.extensions, "extensions");
for (const extensionPath of extensions) {
  assertExists(extensionPath, "pi.extensions entry");
}

const skills = asStringArray(packageJson.pi?.skills, "skills");
for (const skillsPath of skills) {
  assertExists(skillsPath, "pi.skills entry");
}

const skillsRoot = path.join(root, "skills");
if (!existsSync(skillsRoot)) {
  fail("skills/ directory does not exist.");
} else {
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillMdPath = path.join(skillsRoot, entry.name, "SKILL.md");
    if (!existsSync(skillMdPath)) {
      fail(`skill directory is missing SKILL.md: skills/${entry.name}`);
    }
  }
}

const orchestratorSource = await Bun.file(orchestratorPath).text();
for (const command of requiredCommands) {
  if (!orchestratorSource.includes(command) && !orchestratorSource.includes(`/${command}`)) {
    fail(`extensions/orchestrator.ts must contain command contract: /${command}`);
  }
}

const buildDir = await mkdtemp(path.join(tmpdir(), "orquestador-sdd-tdd-check-"));
const buildResult = await Bun.build({
  entrypoints: [orchestratorPath],
  outdir: buildDir,
  target: "node",
});

if (!buildResult.success) {
  for (const log of buildResult.logs) {
    fail(log.message);
  }
}

rmSync(buildDir, { recursive: true, force: true });

if (failures.length > 0) {
  console.error("Package validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Package validation OK");

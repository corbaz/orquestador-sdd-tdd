import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const TAG_PREFIX = "v";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function runSafe(cmd: string): string {
  try {
    return run(cmd);
  } catch {
    return "";
  }
}

function getBumpType(): "major" | "minor" | "patch" {
  const lastTag = runSafe("git describe --tags --abbrev=0 2>nul");
  if (!lastTag) return "minor";

  const log = runSafe(`git log ${lastTag}..HEAD --format=%B`);
  if (!log) return "patch";

  if (log.includes("BREAKING CHANGE") || /feat(\(.*\))?!:/.test(log)) return "major";
  if (/feat(\(.*\))?:/.test(log)) return "minor";
  return "patch";
}

function bumpVersion(current: string, bump: "major" | "minor" | "patch"): string {
  const [major, minor, patch] = current.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function getLatestTagForVersion(version: string): string {
  return runSafe(`git tag -l '${TAG_PREFIX}${version}'`).split("\n")[0] || "";
}

// --- Main ---

const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const currentVersion = pkg.version as string;
const bump = getBumpType();
const newVersion = bumpVersion(currentVersion, bump);

if (getLatestTagForVersion(newVersion)) {
  console.error(`Tag ${TAG_PREFIX}${newVersion} already exists. Aborting.`);
  process.exit(1);
}

// 1. Bump package.json
pkg.version = newVersion;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

// 2. Update CHANGELOG
const changelogPath = "CHANGELOG.md";
let changelog = readFileSync(changelogPath, "utf8");
const date = new Date().toISOString().slice(0, 10);
const entry = `## ${newVersion} - ${date}\n\nRelease automatizado.\n\n### Commits\n\n`;
const lines = runSafe("git log --oneline --no-decorate " + runSafe("git describe --tags --abbrev=0 2>nul") + "..HEAD") || "Initial release.\n";
changelog = changelog.replace(/(# Changelog\n\n)/, `$1${entry}${lines}\n`);
writeFileSync(changelogPath, changelog, "utf8");

// 3. Commit
run(`git add package.json CHANGELOG.md`);
run(`git commit -m "chore: release v${newVersion}"`);

// 4. Tag
run(`git tag ${TAG_PREFIX}${newVersion}`);

// 5. Push
run(`git push`);
run(`git push origin ${TAG_PREFIX}${newVersion}`);

// 6. GitHub Release
const logSince = runSafe(`git log --oneline --no-decorate ${TAG_PREFIX}${newVersion}~5..${TAG_PREFIX}${newVersion}`) || `v${newVersion}`;
const notes = `## v${newVersion}\n\n### Commits\n\n${logSince}`;
run(`gh release create ${TAG_PREFIX}${newVersion} --title "v${newVersion}" --notes "${notes.replace(/"/g, '\\"')}"`);

console.log(`Released ${TAG_PREFIX}${newVersion} (${bump} bump)`);

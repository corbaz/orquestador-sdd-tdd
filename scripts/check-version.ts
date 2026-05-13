import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version as string;

let latestTag = "";
try {
  latestTag = execSync("git describe --tags --abbrev=0 2>nul", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  if (latestTag.startsWith("v")) latestTag = latestTag.slice(1);
} catch {
  console.log("Version check: no tags found, skipping.");
  process.exit(0);
}

if (!latestTag) {
  console.log("Version check: no tags found, skipping.");
  process.exit(0);
}

if (pkgVersion !== latestTag) {
  console.error(`Version mismatch: package.json says ${pkgVersion}, latest git tag says ${latestTag}.`);
  console.error("Fix: bump package.json version to match the tag you intend to create.");
  process.exit(1);
}

console.log(`Version check OK: ${pkgVersion}`);

import os from "node:os";
import path from "node:path";

export const PACKAGE_ID = "orquestador-sdd-tdd";

export function getGlobalStateDir(homeDir = os.homedir()): string {
  return path.join(homeDir, ".pi", "agent", PACKAGE_ID);
}

export function getGlobalDatabasePath(homeDir = os.homedir()): string {
  return path.join(getGlobalStateDir(homeDir), "orchestrator.sqlite");
}

export function getProjectStateDir(projectRoot = process.cwd()): string {
  return path.join(projectRoot, ".pi", PACKAGE_ID);
}

export function getLocalDatabasePath(projectRoot = process.cwd()): string {
  return path.join(getProjectStateDir(projectRoot), "project.sqlite");
}

export function getLocalMetadataPath(projectRoot = process.cwd()): string {
  return path.join(getProjectStateDir(projectRoot), "metadata.json");
}

export function getGlobalSchemaPath(homeDir = os.homedir()): string {
  return path.join(getGlobalStateDir(homeDir), "schema.sql");
}

export function getLocalSchemaPath(projectRoot = process.cwd()): string {
  return path.join(getProjectStateDir(projectRoot), "schema.sql");
}

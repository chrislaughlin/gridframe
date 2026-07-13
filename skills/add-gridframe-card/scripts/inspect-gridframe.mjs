#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

const SCHEMA_URL =
  "https://raw.githubusercontent.com/chrislaughlin/gridframe/main/skills/gridframe.schema.json";
const root = resolve(process.argv[2] ?? process.cwd());
const files = walk(root, 4_000);
const manifests = files.filter((file) => basename(file) === "gridframe.json");
const legacyCandidates = files
  .filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file))
  .map((file) => ({ file, matches: sourceMatches(file) }))
  .filter((candidate) => candidate.matches.length > 0)
  .slice(0, 75);

const results = manifests.map(validateManifest);
const status =
  manifests.length > 1
    ? "ambiguous"
    : manifests.length === 1
      ? results[0].valid
        ? "valid"
        : "invalid"
      : legacyCandidates.length > 0
        ? "legacy"
        : "missing";

process.stdout.write(
  `${JSON.stringify({ root, status, manifests: results, legacyCandidates }, null, 2)}\n`,
);
process.exit(
  status === "valid" || status === "legacy"
    ? 0
    : status === "ambiguous"
      ? 2
      : 1,
);

function validateManifest(path) {
  const errors = [];
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    return { path, valid: false, errors: [`Invalid JSON: ${error.message}`] };
  }

  if (manifest.$schema !== SCHEMA_URL) {
    errors.push("$schema is not the Gridframe schema URL");
  }
  if (manifest.version !== 1) errors.push("version must be 1");
  if (manifest.mode !== "api-managed")
    errors.push('mode must be "api-managed"');
  const values = {
    cardDefinitions: manifest.paths?.cardDefinitions,
    dashboardSeed: manifest.paths?.dashboardSeed,
    handlers: manifest.paths?.handlers,
    repository: manifest.paths?.repository,
    dashboardComponent: manifest.paths?.dashboardComponent,
  };
  for (const [label, value] of Object.entries(values))
    checkPath(path, label, value, errors);
  if (
    !Array.isArray(manifest.paths?.routeMounts) ||
    manifest.paths.routeMounts.length === 0
  ) {
    errors.push("routeMounts must contain at least one path");
  } else {
    manifest.paths.routeMounts.forEach((value, index) =>
      checkPath(path, `routeMounts[${index}]`, value, errors),
    );
  }
  const packageJsonPath = findUp(dirname(path), "package.json");
  const packages = {};
  if (!packageJsonPath) {
    errors.push("No package.json found for the integration");
  } else {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    for (const name of [
      "@gridframe/core",
      "@gridframe/react",
      "@gridframe/server",
    ]) {
      if (!dependencies[name]) errors.push(`${name} is not installed directly`);
      else packages[name] = dependencies[name];
    }
    const majors = Object.values(packages).map(majorVersion).filter(Boolean);
    if (new Set(majors).size > 1) {
      errors.push("Gridframe package major versions do not match");
    }
    if (majors.some((major) => major !== 1)) {
      errors.push("These skills support Gridframe 1.x");
    }
    if (
      !dependencyRequiresAtLeast(packages["@gridframe/server"], [1, 1, 0])
    ) {
      errors.push("@gridframe/server must be version 1.1.0 or newer");
    }
  }
  return { path, valid: errors.length === 0, errors, manifest, packages };
}

function checkPath(manifestPath, label, value, errors) {
  if (typeof value !== "string" || value.length === 0 || isAbsolute(value)) {
    errors.push(`${label} must be a non-empty relative path`);
  } else if (!existsSync(resolve(dirname(manifestPath), value))) {
    errors.push(`${label} does not exist: ${value}`);
  }
}

function sourceMatches(path) {
  if (statSync(path).size > 1_000_000) return [];
  const source = readFileSync(path, "utf8");
  return [
    "createDashboardHandlers",
    "CardLibraryTemplate",
    "defaultDashboard",
    "resolveCardData",
    "PanelDashboard",
    "DashboardRepository",
  ].filter((needle) => source.includes(needle));
}

function walk(directory, limit, results = []) {
  if (!existsSync(directory) || results.length >= limit) return results;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      [".git", ".next", ".turbo", "coverage", "dist", "node_modules"].includes(
        entry.name,
      )
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, limit, results);
    else if (entry.isFile()) results.push(path);
    if (results.length >= limit) break;
  }
  return results;
}

function findUp(start, name) {
  let current = start;
  while (true) {
    const candidate = join(current, name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function majorVersion(range) {
  const match = String(range).match(/(?:^|[^0-9])(\d+)\./);
  return match ? Number(match[1]) : undefined;
}

function dependencyRequiresAtLeast(range, minimum) {
  let value = String(range).trim();
  if (/^workspace:(?:\*|\^|~)$/.test(value)) return true;
  value = value.replace(/^workspace:/, "");
  const match = value.match(
    /^(?:\^|~|>=)?\s*(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:\s+<\s*\d+(?:\.\d+){0,2})?$/i,
  );
  if (!match) return false;
  const version = match.slice(1).map((part) =>
    part === undefined || part === "x" || part === "*" ? 0 : Number(part),
  );
  return (
    version.some(
      (part, index) =>
        part > minimum[index] &&
        version
          .slice(0, index)
          .every((value, prior) => value === minimum[prior]),
    ) || version.every((part, index) => part === minimum[index])
  );
}

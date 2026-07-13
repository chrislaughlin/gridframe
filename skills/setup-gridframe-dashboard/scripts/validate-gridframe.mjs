#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

const SCHEMA_URL =
  "https://raw.githubusercontent.com/chrislaughlin/gridframe/main/skills/gridframe.schema.json";
const target = resolve(process.argv[2] ?? process.cwd());
const manifests = target.endsWith(".json") ? [target] : findManifests(target);

if (manifests.length === 0) finish("missing", ["No gridframe.json found"], []);
if (manifests.length > 1) {
  finish("ambiguous", ["Multiple gridframe.json files found"], manifests);
}

const manifestPath = manifests[0];
const errors = [];
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  finish("invalid", [`Invalid JSON: ${error.message}`], manifests);
}

if (manifest.$schema !== SCHEMA_URL)
  errors.push("$schema is not the Gridframe schema URL");
if (manifest.version !== 1) errors.push("version must be 1");
if (manifest.mode !== "api-managed") errors.push('mode must be "api-managed"');

const required = [
  "cardDefinitions",
  "dashboardSeed",
  "handlers",
  "repository",
  "dashboardComponent",
];
for (const key of required) validatePath(key, manifest.paths?.[key]);

if (
  !Array.isArray(manifest.paths?.routeMounts) ||
  manifest.paths.routeMounts.length === 0
) {
  errors.push("paths.routeMounts must contain at least one relative path");
} else {
  const unique = new Set(manifest.paths.routeMounts);
  if (unique.size !== manifest.paths.routeMounts.length) {
    errors.push("paths.routeMounts must not contain duplicates");
  }
  manifest.paths.routeMounts.forEach((path, index) =>
    validatePath(`routeMounts[${index}]`, path),
  );
}

const packageJsonPath = findUp(dirname(manifestPath), "package.json");
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
  if (new Set(majors).size > 1)
    errors.push("Gridframe package major versions do not match");
  if (majors.some((major) => major !== 1))
    errors.push("These skills support Gridframe 1.x");
  if (!dependencyRequiresAtLeast(packages["@gridframe/server"], [1, 1, 0])) {
    errors.push("@gridframe/server must be version 1.1.0 or newer");
  }
}

finish(errors.length ? "invalid" : "valid", errors, manifests, {
  manifest: manifestPath,
  packages,
});

function validatePath(label, value) {
  if (typeof value !== "string" || value.length === 0 || isAbsolute(value)) {
    errors.push(`paths.${label} must be a non-empty relative path`);
    return;
  }
  if (!existsSync(resolve(dirname(manifestPath), value))) {
    errors.push(`paths.${label} does not exist: ${value}`);
  }
}

function findManifests(directory, results = []) {
  if (!existsSync(directory)) return results;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      [".git", ".next", ".turbo", "dist", "node_modules"].includes(entry.name)
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) findManifests(path, results);
    else if (entry.isFile() && entry.name === "gridframe.json")
      results.push(path);
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

function finish(status, errors, found, extra = {}) {
  process.stdout.write(
    `${JSON.stringify({ status, errors, manifests: found, ...extra }, null, 2)}\n`,
  );
  process.exit(status === "valid" ? 0 : status === "ambiguous" ? 2 : 1);
}

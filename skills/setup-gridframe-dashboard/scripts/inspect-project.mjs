#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? process.cwd());
const packageJsonPath = join(root, "package.json");

if (!existsSync(packageJsonPath)) {
  fail(`No package.json found at ${packageJsonPath}`);
}

const packageJson = readJson(packageJsonPath);
const dependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};
const files = walk(root, 4_000);
const manifests = files.filter((file) => basename(file) === "gridframe.json");
const sourceFiles = files.filter((file) => /\.(?:[cm]?[jt]sx?)$/.test(file));
const gridframeCandidates = sourceFiles
  .filter((file) =>
    containsAny(file, [
      "@gridframe/",
      "createDashboardHandlers",
      "CardLibraryTemplate",
      "PanelDashboard",
    ]),
  )
  .slice(0, 50);

const output = {
  root,
  packageManager: detectPackageManager(root, packageJson),
  scripts: packageJson.scripts ?? {},
  gridframePackages: pickDependencies(dependencies, (name) =>
    name.startsWith("@gridframe/"),
  ),
  frameworks: pickDependencies(dependencies, (name) =>
    [
      "next",
      "express",
      "hono",
      "@tanstack/react-start",
      "@tanstack/start",
      "react-router",
      "fastify",
    ].includes(name),
  ),
  authentication: pickDependencies(dependencies, (name) =>
    /(?:^|\/)(?:next-auth|auth|clerk|better-auth|lucia|passport)/i.test(name),
  ),
  persistence: pickDependencies(dependencies, (name) =>
    /(?:prisma|drizzle|kysely|knex|typeorm|sequelize|mongoose|mongodb|postgres|^pg$|neon|sqlite|mysql)/i.test(
      name,
    ),
  ),
  migrationPaths: files
    .filter((file) => /(?:^|\/)(?:migrations?|prisma)(?:\/|$)/.test(file))
    .slice(0, 50),
  manifests,
  gridframeCandidates,
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);

function walk(directory, limit, results = []) {
  if (results.length >= limit) return results;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      [".git", ".next", ".turbo", "coverage", "dist", "node_modules"].includes(
        entry.name,
      )
    ) {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, limit, results);
    else if (entry.isFile()) results.push(path);
    if (results.length >= limit) break;
  }
  return results;
}

function containsAny(path, needles) {
  if (statSync(path).size > 1_000_000) return false;
  const source = readFileSync(path, "utf8");
  return needles.some((needle) => source.includes(needle));
}

function detectPackageManager(directory, manifest) {
  if (typeof manifest.packageManager === "string")
    return manifest.packageManager;
  for (const [lockfile, manager] of [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ]) {
    if (existsSync(join(directory, lockfile))) return manager;
  }
  return "unknown";
}

function pickDependencies(input, predicate) {
  return Object.fromEntries(
    Object.entries(input).filter(([name]) => predicate(name)),
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

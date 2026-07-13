import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const setupInspector = resolve(
  "skills/setup-gridframe-dashboard/scripts/inspect-project.mjs",
);
const validator = resolve(
  "skills/setup-gridframe-dashboard/scripts/validate-gridframe.mjs",
);
const cardInspector = resolve(
  "skills/add-gridframe-card/scripts/inspect-gridframe.mjs",
);

test("setup inspector reports framework, auth, persistence, and Gridframe versions", () => {
  withFixture((root) => {
    writeJson(join(root, "package.json"), {
      packageManager: "pnpm@9.0.0",
      scripts: { test: "vitest run" },
      dependencies: {
        next: "16.2.10",
        "better-auth": "1.2.0",
        "@neondatabase/serverless": "1.0.0",
        "@gridframe/server": "1.0.1",
      },
    });
    write(join(root, "src/gridframe.ts"), 'import "@gridframe/server";\n');

    const result = run(setupInspector, root);

    assert.equal(result.packageManager, "pnpm@9.0.0");
    assert.equal(result.frameworks.next, "16.2.10");
    assert.equal(result.authentication["better-auth"], "1.2.0");
    assert.equal(result.persistence["@neondatabase/serverless"], "1.0.0");
    assert.equal(result.gridframeCandidates.length, 1);
  });
});

test("validator accepts a complete single-package manifest", () => {
  withFixture((root) => {
    createIntegration(root);
    const result = run(validator, root);
    assert.equal(result.status, "valid");
    assert.deepEqual(result.errors, []);
  });
});

test("validator rejects missing paths and mismatched package majors", () => {
  withFixture((root) => {
    createIntegration(root);
    const packageJson = JSON.parse(read(join(root, "package.json")));
    packageJson.dependencies["@gridframe/react"] = "^2.0.0";
    writeJson(join(root, "package.json"), packageJson);
    rmSync(join(root, "src/cards.ts"));

    const result = run(validator, root, true);
    assert.equal(result.status, "invalid");
    assert(result.errors.some((error) => error.includes("cardDefinitions")));
    assert(result.errors.some((error) => error.includes("major versions")));
  });
});

test("validator reports ambiguous manifests in a monorepo", () => {
  withFixture((root) => {
    createIntegration(join(root, "apps/one"));
    createIntegration(join(root, "apps/two"));
    const result = run(validator, root, true);
    assert.equal(result.status, "ambiguous");
    assert.equal(result.manifests.length, 2);
  });
});

test("Card inspector identifies a pre-manifest legacy integration", () => {
  withFixture((root) => {
    writeJson(join(root, "package.json"), {});
    write(
      join(root, "src/dashboard.ts"),
      "createDashboardHandlers({ cardLibrary, resolveCardData });\n",
    );
    const result = run(cardInspector, root);
    assert.equal(result.status, "legacy");
    assert.deepEqual(result.legacyCandidates[0].matches, [
      "createDashboardHandlers",
      "resolveCardData",
    ]);
  });
});

test("Card inspector resolves manifest paths in a nested application", () => {
  withFixture((root) => {
    const app = join(root, "apps/web");
    createIntegration(app);
    const result = run(cardInspector, root);
    assert.equal(result.status, "valid");
    assert.equal(result.manifests[0].valid, true);
  });
});

test("Card inspector rejects mismatched Gridframe package majors", () => {
  withFixture((root) => {
    createIntegration(root);
    const packageJson = JSON.parse(read(join(root, "package.json")));
    packageJson.dependencies["@gridframe/server"] = "^2.0.0";
    writeJson(join(root, "package.json"), packageJson);

    const result = run(cardInspector, root, true);
    assert.equal(result.status, "invalid");
    assert(
      result.manifests[0].errors.some((error) =>
        error.includes("major versions"),
      ),
    );
  });
});

function createIntegration(root) {
  writeJson(join(root, "package.json"), {
    dependencies: {
      "@gridframe/core": "^1.0.1",
      "@gridframe/react": "^1.0.1",
      "@gridframe/server": "^1.0.1",
    },
  });
  for (const file of [
    "src/cards.ts",
    "src/seed.ts",
    "src/handlers.ts",
    "src/repository.ts",
    "src/dashboard.tsx",
    "src/routes.ts",
  ]) {
    write(join(root, file), "export {};\n");
  }
  writeJson(join(root, "gridframe.json"), {
    $schema:
      "https://raw.githubusercontent.com/chrislaughlin/gridframe/main/skills/gridframe.schema.json",
    version: 1,
    mode: "api-managed",
    paths: {
      cardDefinitions: "src/cards.ts",
      dashboardSeed: "src/seed.ts",
      handlers: "src/handlers.ts",
      repository: "src/repository.ts",
      dashboardComponent: "src/dashboard.tsx",
      routeMounts: ["src/routes.ts"],
    },
  });
}

function withFixture(callback) {
  const root = mkdtempSync(join(tmpdir(), "gridframe-skills-"));
  try {
    callback(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function run(script, root, allowFailure = false) {
  try {
    return JSON.parse(
      execFileSync(process.execPath, [script, root], { encoding: "utf8" }),
    );
  } catch (error) {
    if (!allowFailure) throw error;
    return JSON.parse(error.stdout);
  }
}

function write(path, contents) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, contents);
}

function writeJson(path, value) {
  write(path, `${JSON.stringify(value, null, 2)}\n`);
}

function read(path) {
  return readFileSync(path, "utf8");
}

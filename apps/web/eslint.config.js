import { globalIgnores } from "eslint/config";
import { nextJsConfig } from "@gridframe/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [...nextJsConfig, globalIgnores(["public/mockServiceWorker.js"])];

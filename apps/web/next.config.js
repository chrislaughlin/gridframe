import nextEnv from "@next/env";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const { loadEnvConfig } = nextEnv;
loadEnvConfig(
  repositoryRoot,
  process.env.NODE_ENV === "development",
  undefined,
  true,
);

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;

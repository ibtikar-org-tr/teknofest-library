#!/usr/bin/env node
/**
 * Thin wrapper — şablon seeding uploads to R2 (see seed-sablon-templates.py).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, "seed-sablon-templates.py");
const venvPy = path.resolve(
  here,
  "../../libary-filesync/venv/bin/python",
);
const py = process.env.PYTHON || venvPy;

const result = spawnSync(py, [script], {
  cwd: path.resolve(here, ".."),
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

// Historical source is preserved byte-for-byte, including old whitespace.
const { spawnSync } = require("node:child_process");

const historical = [
  "alpha/**",
  "OLD_PROJECTS_CSS_TSX/**",
  "recovered/**",
  "interfaces/desktop/src/lib/design/**",
  "interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/_archive/**",
  "systems/maestro/**",
  "systems/engine/**",
  "systems/devpulse-engine/src/engine/**",
  "systems/devpulse-engine/src/hyde/**",
  "kernel/core/**",
  "kernel/devpulse-maestro/**",
  "kernel/devpulse-clyffy/src/connectome/**",
];
const result = spawnSync("git", ["diff", "--cached", "--check", "--", ".", ...historical.map((p) => `:(exclude)${p}`)], { stdio: "inherit" });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);

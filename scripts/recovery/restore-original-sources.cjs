/* Restore preserved source groups to their original paths.
 * Existing destinations and case-disambiguated revisions are never overwritten.
 * This does not put alpha in the current application build. */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = fs.realpathSync(process.cwd());
const archive = path.join(root, "recovered", "repo");
const manifest = path.join(archive, "SOURCES.tsv");
const contents = fs.readFileSync(manifest, "utf8");
const lines = contents.split(/\r?\n/);
const header = lines[0].split("\t");
const column = Object.fromEntries(header.map((name, index) => [name, index]));
const mode = process.argv[2] || "alpha";
if (!["alpha", "design-css", "design-data", "design-source", "design-docs", "onboarding-archive", "historical-rust", "inactive-rust", "old-projects"].includes(mode)) throw new Error("Unknown restoration group");
const prefixes = mode === "alpha"
  ? ["alpha/desktop/", "alpha/engine/", "alpha/orchestrator/", "alpha/shared/", "alpha/bad_desktop/", "alpha/lab/", "alpha/archive/", "alpha/scripts/", "alpha/xtask/"]
  : mode === "design-css"
    ? ["interfaces/desktop/src/lib/design/"]
    : mode === "design-data"
      ? ["interfaces/desktop/src/lib/design/components/", "interfaces/desktop/src/lib/design/tokens/", "interfaces/desktop/src/lib/design/taxonomy/", "interfaces/desktop/src/lib/design/presets/", "interfaces/desktop/src/lib/design/effects/", "interfaces/desktop/src/lib/design/blueprints/"]
      : mode === "design-source"
        ? ["interfaces/desktop/src/lib/design/"]
        : mode === "design-docs"
          ? ["interfaces/desktop/src/lib/design/.cowlevel/"]
          : mode === "onboarding-archive"
            ? ["interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/_archive/"]
            : mode === "historical-rust"
              ? ["systems/maestro/", "systems/engine/", "kernel/core/", "kernel/devpulse-maestro/"]
              : mode === "inactive-rust"
                ? ["systems/devpulse-engine/src/engine/", "systems/devpulse-engine/src/hyde/", "kernel/devpulse-clyffy/src/connectome/"]
                : ["OLD_PROJECTS_CSS_TSX/"];
const pending = [];
const targets = new Set();

for (let i = 1; i < lines.length; i++) {
  if (!lines[i]) continue;
  const fields = lines[i].split("\t");
  const sourcePath = fields[column.path];
  if (!prefixes.some((prefix) => sourcePath.startsWith(prefix)) && !(mode === "alpha" && sourcePath === "alpha/alpha_devpulse.code-workspace")) continue;
  if (mode === "design-css" && !sourcePath.endsWith(".css")) continue;
  if (mode === "design-data" && (!/\.(json|svg|png|webp|ttf|woff2?)$/i.test(sourcePath) || /(?:^|\/)(package|tsconfig)\.json$/i.test(sourcePath))) continue;
  if (mode === "design-source" && (!/\.(ts|svelte|tsx|js|mjs)$/i.test(sourcePath) || sourcePath.includes("/.claude/"))) continue;
  if (fields[column.restored_to] || fields[column.recovered_as] !== sourcePath) continue;
  const destination = path.resolve(root, sourcePath);
  const source = path.resolve(archive, fields[column.recovered_as]);
  if (!destination.startsWith(`${root}${path.sep}`) || !source.startsWith(`${archive}${path.sep}`)) {
    throw new Error(`Path outside the workspace: ${sourcePath}`);
  }
  if (!fs.existsSync(source)) continue;
  const actualSource = fs.realpathSync(source);
  if (!actualSource.startsWith(`${archive}${path.sep}`)) throw new Error(`Staging source leaves archive: ${sourcePath}`);
  const alreadyPresent = fs.existsSync(destination);
  if (alreadyPresent && !fs.realpathSync(destination).startsWith(`${root}${path.sep}`)) throw new Error(`Destination leaves workspace: ${sourcePath}`);
  if (alreadyPresent && (!fs.statSync(destination).isFile() || !fs.readFileSync(destination).equals(fs.readFileSync(source)))) continue;
  // Refuse a symlink/junction in an existing parent that leaves the workspace.
  let parent = path.dirname(destination);
  while (!fs.existsSync(parent)) parent = path.dirname(parent);
  const realParent = fs.realpathSync(parent);
  if (realParent !== root && !realParent.startsWith(`${root}${path.sep}`)) throw new Error(`Destination parent leaves workspace: ${sourcePath}`);
  const targetKey = destination.toLowerCase();
  if (targets.has(targetKey)) throw new Error(`Case collision: ${sourcePath}`);
  targets.add(targetKey);
  pending.push({ i, fields, sourcePath, source, destination, alreadyPresent, query: `${fields[column.copied_from]}:${sourcePath}` });
}

// Batch-read the original Git blobs and compare before creating any file.
const git = spawnSync("git", ["cat-file", "--batch"], {
  input: pending.map((item) => item.query).join("\n") + "\n",
  maxBuffer: 256 * 1024 * 1024,
});
if (git.status !== 0 || git.error) throw git.error || new Error(git.stderr.toString());
let offset = 0;
for (const item of pending) {
  const end = git.stdout.indexOf(10, offset);
  if (end < 0) throw new Error(`Missing Git blob header: ${item.query}`);
  const parts = git.stdout.subarray(offset, end).toString("utf8").split(" ");
  if (parts.length !== 3 || parts[1] !== "blob") throw new Error(`Missing Git blob: ${item.query}`);
  const size = Number(parts[2]);
  const start = end + 1;
  const blob = git.stdout.subarray(start, start + size);
  if (blob.length !== size || !blob.equals(fs.readFileSync(item.source))) throw new Error(`Original differs: ${item.sourcePath}`);
  offset = start + size + 1;
}

for (const item of pending) {
  fs.mkdirSync(path.dirname(item.destination), { recursive: true });
  // A concurrent editor must never be overwritten. Staging is retained.
  if (!item.alreadyPresent) fs.copyFileSync(item.source, item.destination, fs.constants.COPYFILE_EXCL);
  if (!fs.readFileSync(item.destination).equals(fs.readFileSync(item.source))) throw new Error(`Copy differs: ${item.sourcePath}`);
  item.fields[column.restored_to] = item.sourcePath;
  lines[item.i] = item.fields.join("\t");
}
const temporary = `${manifest}.${process.pid}.tmp`;
fs.writeFileSync(temporary, lines.join("\n"), { flag: "wx" });
fs.renameSync(temporary, manifest);
console.log(`Restored ${pending.filter((item) => !item.alreadyPresent).length} ${mode} files; recorded ${pending.filter((item) => item.alreadyPresent).length} identical existing destinations; staged copies retained.`);

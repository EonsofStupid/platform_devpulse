/**
 * @file docs/site/scripts/sync-docs.ts
 * @module @devpulse/docs/sync
 *
 * Syncs generated documentation into the Docusaurus docs/ directory.
 * Runs before `docusaurus build` to ensure docs are up-to-date.
 *
 * Synced content:
 *   1. COLDLIGHT_MASTER_INVENTORY.md → docs/coldlight/inventory.md
 *   2. Sprint files → docs/sprints/
 *   3. Platform header compliance report → docs/platform/header-compliance.md
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, "..");
const PLATFORM_ROOT = path.resolve(SITE_ROOT, "../..");
const DOCS_DIR = path.join(SITE_ROOT, "docs");

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function copyWithFrontmatter(src: string, dest: string, frontmatter: string): void {
	if (!fs.existsSync(src)) {
		console.warn(`  SKIP: ${src} (not found)`);
		return;
	}
	const content = fs.readFileSync(src, "utf-8");
	fs.writeFileSync(dest, frontmatter + "\n\n" + content);
	console.log(`  SYNC: ${path.relative(PLATFORM_ROOT, src)} → ${path.relative(SITE_ROOT, dest)}`);
}

function main(): void {
	console.log("Syncing docs...\n");

	// 1. Inventory
	ensureDir(path.join(DOCS_DIR, "coldlight"));
	copyWithFrontmatter(
		path.join(PLATFORM_ROOT, "scripts/docs/.claude/COLDLIGHT_MASTER_INVENTORY.md"),
		path.join(DOCS_DIR, "coldlight/inventory.md"),
		`---\nsidebar_position: 3\ntitle: "Master Inventory"\n---`,
	);

	// 2. Sprint index — link to sprint files (not synced: raw markdown may contain MDX-incompatible syntax)
	ensureDir(path.join(DOCS_DIR, "sprints"));
	const sprintsDir = path.join(PLATFORM_ROOT, "scripts/docs/sprints");
	if (fs.existsSync(sprintsDir)) {
		const sprintFiles = fs.readdirSync(sprintsDir).filter((f) => f.endsWith(".md") && !f.includes("research"));
		const researchFiles = fs.readdirSync(sprintsDir).filter((f) => f.includes("research.md"));

		const sprintList = sprintFiles
			.sort()
			.map((f) => `- ${f.replace(/\.md$/, "")}`)
			.join("\n");

		const researchList = researchFiles
			.sort()
			.map((f) => `- ${f.replace(/\.md$/, "")}`)
			.join("\n");

		fs.writeFileSync(
			path.join(DOCS_DIR, "sprints/index.md"),
			`---\nsidebar_position: 1\ntitle: "Sprint Plans"\n---\n\n# Sprint Plans\n\nSprint files are in \`scripts/docs/sprints/\`. Regenerate the inventory after each sprint:\n\n\`\`\`bash\npnpm coldlight:inventory --write\n\`\`\`\n\n## Sprints\n\n${sprintList}\n\n## Research Documents\n\n${researchList}\n`,
		);
		console.log(`  CREATE: sprints/index.md (${sprintFiles.length} sprints, ${researchFiles.length} research)`);
	}

	// 3. Generate platform namespaces page (static for now)
	ensureDir(path.join(DOCS_DIR, "platform"));
	fs.writeFileSync(
		path.join(DOCS_DIR, "platform/namespaces.md"),
		`---
sidebar_position: 1
title: "Platform Namespaces"
---

# Platform Namespaces

Run \`pnpm platform:scan\` to see the full platform report.
Run \`pnpm platform:scan --write\` to generate \`devpulse.manifest.json\`.

See the [ColdLight Inventory](/coldlight/inventory) for the full primitive status.
`,
	);

	// 4. Header compliance page
	fs.writeFileSync(
		path.join(DOCS_DIR, "platform/header-compliance.md"),
		`---
sidebar_position: 2
title: "Header Compliance"
---

# Header Compliance

The DevPulse platform uses a schema-driven header system to enforce documentation standards.

## Commands

| Command | Purpose |
|---------|---------|
| \`pnpm headers:check\` | Report files with missing/wrong headers |
| \`pnpm headers:inject\` | Add headers to files with no header |
| \`pnpm headers:fix\` | Patch missing tags + inject missing headers |
| \`pnpm headers:validate\` | Strict: exit 1 if any file non-compliant |

## How It Works

1. \`file-context.ts\` resolves namespace, layer, and kind from file paths
2. \`file-schema.ts\` matches against 45+ rules (first match wins)
3. Each rule declares required tags and a header generator
4. \`inject-headers.ts\` checks, injects, or patches headers

## Tag Patching (fix mode)

Fix mode is non-destructive — it inserts missing tags without replacing existing header content:

- **JSDoc**: Tags inserted before \`*/\`
- **Svelte**: Tags inserted before \`-->\`
- **Rust**: Tags appended to \`//!\` block

Run \`pnpm platform:scan\` for current compliance numbers.
`,
	);

	// 5. Create stub pages for sidebar items that don't have content yet
	const stubs = [
		{
			path: "coldlight/primitives/index.md",
			title: "Primitives Overview",
			content:
				"ColdLight primitives are unstyled, accessible components.\n\nSee the [Master Inventory](/coldlight/inventory) for the full list.",
		},
		{
			path: "coldlight/primitives/contracts.md",
			title: "Contracts",
			content:
				"Every primitive declares a `PrimitiveContract` in `contract.ts`.\n\nContracts define: slots, states, ARIA requirements, keyboard bindings, and focus strategy.",
		},
		{
			path: "coldlight/primitives/testing.md",
			title: "Testing",
			content:
				"Primitives are tested with Vitest browser mode (Chromium via Playwright).\n\n```bash\npnpm test:browser\n```",
		},
		{
			path: "coldlight/tokens/index.md",
			title: "Design Tokens",
			content:
				"ColdLight uses Style Dictionary v5 (DTCG 1.0) for the token pipeline.\n\n3-tier: global → semantic → component tokens.\n\n```bash\npnpm ds:tokens:build\n```",
		},
		{
			path: "coldlight/recipes/index.md",
			title: "Recipes",
			content: "Recipes are styling patterns applied to primitives via the `class` prop.\n\nRecipes do NOT own state or behavior — they only declare visual treatments.",
		},
	];

	for (const stub of stubs) {
		const destPath = path.join(DOCS_DIR, stub.path);
		ensureDir(path.dirname(destPath));
		if (!fs.existsSync(destPath)) {
			fs.writeFileSync(destPath, `---\ntitle: "${stub.title}"\n---\n\n# ${stub.title}\n\n${stub.content}\n`);
			console.log(`  CREATE: ${stub.path}`);
		}
	}

	console.log("\nDocs sync complete.");
}

main();

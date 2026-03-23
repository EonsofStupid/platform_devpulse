#!/usr/bin/env npx tsx
/**
 * @file collect-component-tokens.ts
 * @package @devpulse/coldlight
 *
 * Scans colocated tokens.ts files from components/{kind}/tokens.ts.
 * Converts flat dot-key DTCG token defs into nested JSON for SD5.
 * Writes to tokens/src/component-tokens.json (SD5 source).
 *
 * Run before SD5 build: pnpm ds:tokens:collect
 */

import { readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const COMPONENTS_DIR = resolve("src/lib/design/components");
const OUTPUT = resolve("scripts/build/styledictionary/tokens/src/component-tokens.json");

interface TokenDef {
	$value: string | number | object;
	$type: string;
	$description?: string;
}

/**
 * Convert flat dot-key tokens into nested DTCG JSON.
 * "button.root.background.default" → { button: { root: { background: { default: { $value, $type } } } } }
 */
function nestTokens(flat: Record<string, TokenDef>): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, def] of Object.entries(flat)) {
		const parts = key.split(".");
		let current = result;

		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!current[part] || typeof current[part] !== "object") {
				current[part] = {};
			}
			current = current[part] as Record<string, unknown>;
		}

		const leaf = parts[parts.length - 1];
		current[leaf] = {
			$value: def.$value,
			$type: def.$type,
			...(def.$description ? { $description: def.$description } : {}),
		};
	}

	return result;
}

async function collect() {
	const merged: Record<string, unknown> = {};
	const kinds = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory() && !d.name.startsWith("_"))
		.map((d) => d.name);

	let count = 0;

	for (const kind of kinds) {
		const tokensPath = join(COMPONENTS_DIR, kind, "tokens.ts");
		if (!existsSync(tokensPath)) continue;

		// Dynamic import — Windows needs file:// URL
		const fileUrl = `file:///${tokensPath.replace(/\\/g, "/")}`;
		const mod = await import(fileUrl);

		// Find the exported tokens object (first export matching *Tokens pattern)
		for (const [exportName, value] of Object.entries(mod)) {
			if (exportName.endsWith("Tokens") && typeof value === "object" && value !== null) {
				const nested = nestTokens(value as Record<string, TokenDef>);
				Object.assign(merged, nested);
				count++;
				console.log(`  [collect] ${kind}: ${Object.keys(value as object).length} tokens from ${exportName}`);
			}
		}
	}

	writeFileSync(OUTPUT, JSON.stringify(merged, null, "\t"));
	console.log(`[collect] Wrote ${OUTPUT} (${count} token sets)`);
}

collect().catch((err) => {
	console.error("[collect] Failed:", err);
	process.exit(1);
});

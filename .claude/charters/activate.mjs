#!/usr/bin/env node
// activate.mjs — mark a charter ACTIVE (writes active.json) with robust JSON.
// Used by fork.ps1 / fork.sh / the /fork skill. Cross-platform, zero deps.
//
//   node activate.mjs <slug>    -> activate <slug>
//   node activate.mjs clear     -> clear the active charter
//   node activate.mjs           -> list charters + show the active one
//
// Resolves its own directory; no hardcoded paths. See README.md.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ACTIVE = path.join(DIR, "active.json");
const slug = process.argv[2];

const charters = () =>
	fs
		.readdirSync(DIR)
		.filter((f) => f.endsWith(".md") && f !== "README.md")
		.map((f) => f.replace(/\.md$/, ""));

if (slug === "clear") {
	fs.writeFileSync(ACTIVE, JSON.stringify({ slug: null }, null, 2) + "\n");
	console.log("Active charter cleared.");
	process.exit(0);
}

if (!slug) {
	let activeSlug = null;
	try {
		activeSlug = JSON.parse(fs.readFileSync(ACTIVE, "utf-8")).slug;
	} catch {
		/* none */
	}
	console.log("Charters in .claude/charters/:");
	for (const c of charters()) console.log(`  ${c === activeSlug ? "▶" : " "} ${c}`);
	console.log("\nUsage: node activate.mjs <slug>|clear");
	process.exit(0);
}

const charterFile = path.join(DIR, `${slug}.md`);
if (!fs.existsSync(charterFile)) {
	console.error(`Charter not found: ${slug}.md`);
	console.error(`Available: ${charters().join(", ") || "(none)"}`);
	process.exit(1);
}

let goal = "";
const m = fs.readFileSync(charterFile, "utf-8").match(/\*\*Primary goal:\*\*\s*(.+)/i);
if (m) goal = m[1].trim();

fs.writeFileSync(
	ACTIVE,
	JSON.stringify(
		{
			slug,
			goal,
			activatedAt: new Date().toISOString().slice(0, 10),
			note: "Managed by .claude/charters/{activate.mjs,fork.ps1,fork.sh} + the /fork skill. See README.md.",
		},
		null,
		2,
	) + "\n",
);
console.log(`Charter '${slug}' activated.`);

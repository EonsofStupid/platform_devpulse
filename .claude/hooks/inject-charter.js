#!/usr/bin/env node
// inject-charter.js — SessionStart hook.
//
// Surfaces the ACTIVE session charter (if any) as a MINIMAL banner so a new
// or forked session knows its primary mission without the operator
// re-explaining.
//
// Design (June 2026 handoff consensus):
//   - MINIMAL injection + "verify before trust" — announce the charter and
//     point to the file; do NOT dump the charter body (stale context pollutes
//     a fresh session).
//   - NETWORK-INDEPENDENT — reads a local file, NOT SurrealDB, so it works
//     offline. (restore-memory.js short-circuits when SurrealDB is down; the
//     charter must surface regardless of connection.)
//
// Charter system: .claude/charters/  (README.md is the spec). Never throws;
// always exits 0 so it can't block session start.

const fs = require("node:fs");
const path = require("node:path");

// Portable workspace resolution — never hardcode. .claude/hooks -> workspace.
const WORKSPACE = path.resolve(__dirname, "..", "..");
const CHARTERS_DIR = path.join(WORKSPACE, ".claude", "charters");
const ACTIVE = path.join(CHARTERS_DIR, "active.json");

try {
	if (!fs.existsSync(ACTIVE)) process.exit(0);

	const active = JSON.parse(fs.readFileSync(ACTIVE, "utf-8"));
	const slug = active && active.slug;
	if (!slug) process.exit(0); // no active charter

	const charterFile = path.join(CHARTERS_DIR, `${slug}.md`);
	const rel = `.claude/charters/${slug}.md`;

	console.log(`## ⚑ ACTIVE CHARTER — ${slug}\n`);
	if (active.goal) console.log(`**Primary goal:** ${active.goal}\n`);

	if (fs.existsSync(charterFile)) {
		console.log(
			`Full charter: \`${rel}\`. Read it before acting, and **verify it ` +
			`against the current repo before trusting any prior assumptions** ` +
			`(the charter is durable; the code may have moved).`,
		);
	} else {
		console.log(`(Charter file \`${rel}\` not found — recreate it or run \`/fork clear\`.)`);
	}
	console.log(
		`\nThis is the session's primary mission unless the operator redirects. ` +
		`Clear it with \`/fork clear\`.\n`,
	);
} catch {
	// never block session start
}
process.exit(0);

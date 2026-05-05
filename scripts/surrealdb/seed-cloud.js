#!/usr/bin/env node
// One-shot cloud seeder. Token is short-lived (10 min); rotate after running.
// Usage: SURREAL_CLOUD_TOKEN=<jwt> node seed-cloud.js
const fs = require("fs");
const path = require("path");
const https = require("https");

const HOST = "devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud";
const TOKEN = process.env.SURREAL_CLOUD_TOKEN;
if (!TOKEN) { console.error("SURREAL_CLOUD_TOKEN env var required"); process.exit(1); }

const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), "utf-8");

function sql(ns, db, body) {
	return new Promise((resolve, reject) => {
		const req = https.request({
			hostname: HOST, port: 443, path: "/sql", method: "POST",
			headers: {
				"Accept": "application/json",
				"Authorization": `Bearer ${TOKEN}`,
				"NS": ns, "DB": db,
				"Content-Type": "text/plain",
				"Content-Length": Buffer.byteLength(body),
			},
		}, (res) => {
			let buf = ""; res.on("data", (c) => buf += c);
			res.on("end", () => resolve({ status: res.statusCode, body: buf }));
		});
		req.on("error", reject);
		req.write(body); req.end();
	});
}

function summarize(label, r) {
	let ok = 0, err = 0, errs = [];
	try {
		const arr = JSON.parse(r.body);
		for (const stmt of arr) {
			if (stmt.status === "OK") ok++;
			else { err++; errs.push(stmt.result || stmt.detail || JSON.stringify(stmt).slice(0, 200)); }
		}
	} catch (e) { errs.push(`PARSE: ${r.body.slice(0, 300)}`); err++; }
	console.log(`  ${label}: HTTP ${r.status}  ok=${ok}  err=${err}`);
	for (const e of errs.slice(0, 5)) console.log(`    ! ${e}`);
}

(async () => {
	console.log("=== Apply schemas ===");
	summarize("schema-global",   await sql("global",   "knowledge", read("schema-global.surql")));
	summarize("schema-projects", await sql("projects", "devpulse",  read("schema-projects.surql")));

	// schema-agents has no USE DB; we prepend it for each agent DB
	const agentSchema = read("schema-agents.surql");
	for (const db of ["claude", "cursor"]) {
		summarize(`schema-agents/${db}`, await sql("agents", db, `USE NS agents DB ${db};\n` + agentSchema));
	}

	summarize("schema-lessons", await sql("projects", "devpulse",  read("schema-lessons.surql")));

	// Bootstrap a stable root user for the hook (JWT will expire; password won't)
	console.log("=== Provision hook user ===");
	summarize("user devpulse_engine", await sql("global", "knowledge",
		`DEFINE USER devpulse_engine ON ROOT PASSWORD 'dp_sys_2026!' ROLES OWNER;`));

	// schema-access: namespace-scoped users (best-effort; may need ROOT)
	summarize("schema-access", await sql("global", "knowledge", read("schema-access.surql")));

	console.log("=== Apply seeds ===");
	summarize("seed-global",   await sql("global",   "knowledge", read("seed-global.surql")));
	summarize("seed-devpulse", await sql("projects", "devpulse",  read("seed-devpulse.surql")));

	console.log("=== Verify ===");
	const verify = await sql("projects", "devpulse",
		"SELECT count() AS n FROM context GROUP ALL; SELECT count() AS n FROM architecture GROUP ALL;");
	console.log("  context+architecture counts:", verify.body.slice(0, 400));
})();

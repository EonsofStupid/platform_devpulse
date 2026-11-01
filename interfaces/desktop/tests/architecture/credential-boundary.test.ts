/** Saved credentials remain backend-only; the UI receives masked status. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("does not publish the raw vault getter through Tauri or frontend bindings", () => {
	const desktop = join(__dirname, "../..");
	const commands = readFileSync(join(desktop, "src-tauri/src/lib.rs"), "utf8");
	const bindings = readFileSync(join(desktop, "src/lib/sys/generated/bindings.ts"), "utf8");
	const barrel = readFileSync(join(desktop, "src/lib/sys/bindings/credentials/index.ts"), "utf8");
	expect(commands).not.toMatch(/commands::credentials::get_api_key\s*,/);
	expect(bindings).not.toMatch(/TAURI_INVOKE\("get_api_key"/);
	expect(barrel).not.toMatch(/\bgetApiKey\b/);
	expect(bindings).toContain('TAURI_INVOKE("get_api_key_status"');
});

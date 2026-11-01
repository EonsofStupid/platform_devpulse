/** The terminology map supports both views; it never bans technical vocabulary. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "smol-toml";
import { describe, expect, it } from "vitest";
import { findTerm, resolveLabel, TERMS } from "../../src/lib/sys/generated/terminology.js";

type Entry = { kernel: string; engine: string; prod: string; dev: string };
const dictionary = parse(
	readFileSync(join(__dirname, "../../../../systems/devpulse-engine/ip/kernel_terms.toml"), "utf8"),
) as unknown as { enforcement: string; terms: Entry[] };

describe("Included kernel terminology", () => {
	it("has no vocabulary suppression and generates every configured term", () => {
		expect(dictionary.enforcement).toBe("off");
		expect(Object.keys(TERMS)).toHaveLength(dictionary.terms.length);
		for (const term of dictionary.terms) {
			expect(term.kernel.length).toBeGreaterThan(0);
			expect(term.prod.length).toBeGreaterThan(0);
			expect(term.dev.length).toBeGreaterThan(0);
			expect(findTerm(term.kernel)?.kernel).toBe(term.kernel);
			expect(resolveLabel(term.kernel, "simple")).toBe(term.prod);
			expect(resolveLabel(term.kernel, "advanced")).toBe(term.dev);
			expect(resolveLabel(term.engine, "advanced")).toBe(term.dev);
		}
	});
	it("keeps unknown technical names visible, including prototype-like keys", () => {
		for (const name of ["UnknownKernelAlgorithm", "__proto__", "constructor", "toString"]) {
			expect(resolveLabel(name, "simple")).toBe(name);
			expect(resolveLabel(name, "advanced")).toBe(name);
		}
	});
});

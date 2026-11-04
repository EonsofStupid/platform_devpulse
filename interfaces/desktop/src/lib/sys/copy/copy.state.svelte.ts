/**
 * @file copyState — the UI copy catalog, loaded once from Rust.
 * @module @devpulse/sys/copy/copy.state
 *
 * Views take every visible string from here; none holds text of its own.
 * `problem` carries Rust's reason when your `.userdata/config/copy.toml`
 * was not used, so the UI can show it.
 */

import { type CopyCatalog, getCopy } from "#lib/sys/bindings/copy/index.js";
import { logError } from "#lib/sys/logger.js";

class CopyState {
	catalog = $state<CopyCatalog | null>(null);
	problem = $state<string | null>(null);
	error = $state<string | null>(null);
	private loading: Promise<void> | null = null;

	/** Load the catalog once; later calls share the first load. */
	load(): Promise<void> {
		this.loading ??= (async () => {
			const result = await getCopy();
			if (result.status === "error") {
				this.error = result.error;
				logError("copyState", `getCopy failed: ${result.error}`);
				return;
			}
			this.catalog = result.data.copy;
			this.problem = result.data.overrideProblem;
		})();
		return this.loading;
	}
}

export const copyState = new CopyState();

/** Fill `{name}` placeholders in a copy string. */
export function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
		key in values ? String(values[key]) : whole,
	);
}

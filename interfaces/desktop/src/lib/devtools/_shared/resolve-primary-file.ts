/**
 * Primary-file resolver for one-click HuggingFace repo downloads.
 *
 * Given the sibling list from `list_repo_files(repo_id)`, pick ONE
 * filename that should be passed to `download_model(repo_id, filename)`
 * to pull the whole model bundle (the kernel's `execute_download` auto-
 * fetches companion shards, configs, tokenizer files around the
 * primary).
 *
 * Rules — first match wins:
 *   1. Any `.gguf` → the LARGEST GGUF by size. Q8 > Q5 > Q4; users
 *      pick the smaller quants manually if they want to save space.
 *      If sizes are unknown, pick the first `.gguf` alphabetically.
 *   2. `model.safetensors` exact match → single-file SafeTensors checkpoint.
 *   3. `model.safetensors.index.json` present → first numbered shard
 *      (`model-00001-of-*.safetensors`) so `execute_download` can resolve
 *      the rest through the index.
 *   4. Any other `.safetensors` → largest.
 *   5. `config.json`-only repos (adapter-only, tokenizer-only) → null
 *      with a rationale the caller can surface.
 *
 * Pure function — no IPC, no side effects, no Svelte. Unit-testable.
 */

/**
 * Local shape for one repo file entry. Matches the Rust `RepoFile`
 * struct in `commands/models/mod.rs` exactly; swap to the generated
 * `import type { RepoFile } from "$lib/sys/generated/bindings.js"`
 * after the next `cargo xtask run-dev` regenerates specta bindings.
 */
export interface RepoFile {
	name: string;
	size: number | null;
}

export interface PrimaryResolution {
	/** Filename to pass to `download_model(repo_id, primary)`, or null
	 *  when no sensible primary exists and the user must pick manually. */
	primary: string | null;
	/** One-line explanation shown in the confirmation modal. Always
	 *  populated — on `null` primary it explains why. */
	rationale: string;
}

/** Sum of known sibling sizes; `undefined` on any entry is treated as 0. */
export function totalBundleSizeBytes(siblings: RepoFile[]): number {
	return siblings.reduce((sum, s) => sum + (s.size ?? 0), 0);
}

/** Main resolver. Returns `{ primary, rationale }` — never throws. */
export function resolvePrimaryFile(siblings: RepoFile[]): PrimaryResolution {
	if (siblings.length === 0) {
		return { primary: null, rationale: "Repo returned no files." };
	}

	const byExt = (ext: string): RepoFile[] =>
		siblings.filter((s) => s.name.toLowerCase().endsWith(ext));

	// Rule 1 — GGUF, largest wins.
	const ggufs = byExt(".gguf");
	if (ggufs.length > 0) {
		const primary = pickLargest(ggufs) ?? ggufs[0];
		return {
			primary: primary.name,
			rationale: `GGUF: ${ggufs.length === 1 ? "single file" : `largest of ${ggufs.length} quants`}${
				primary.size ? ` (${formatBytes(primary.size)})` : ""
			}`,
		};
	}

	// Rule 2 — single-file SafeTensors.
	const singleSafetensors = siblings.find((s) => s.name === "model.safetensors");
	if (singleSafetensors) {
		return {
			primary: singleSafetensors.name,
			rationale: `SafeTensors: single-file checkpoint${
				singleSafetensors.size ? ` (${formatBytes(singleSafetensors.size)})` : ""
			}`,
		};
	}

	// Rule 3 — sharded SafeTensors via index.
	const indexFile = siblings.find((s) => s.name === "model.safetensors.index.json");
	if (indexFile) {
		const firstShard = siblings
			.filter((s) => /^model-0*1-of-.*\.safetensors$/.test(s.name))
			.sort((a, b) => a.name.localeCompare(b.name))[0];
		if (firstShard) {
			const allShards = siblings.filter(
				(s) => /\.safetensors$/.test(s.name) && s.name.startsWith("model-"),
			);
			return {
				primary: firstShard.name,
				rationale: `SafeTensors: sharded (${allShards.length} shards — bundle downloader resolves the rest via index)`,
			};
		}
	}

	// Rule 4 — other SafeTensors, largest.
	const otherSafetensors = byExt(".safetensors");
	if (otherSafetensors.length > 0) {
		const primary = pickLargest(otherSafetensors) ?? otherSafetensors[0];
		return {
			primary: primary.name,
			rationale: `SafeTensors: largest of ${otherSafetensors.length} files`,
		};
	}

	// Rule 5 — nothing recognizable.
	return {
		primary: null,
		rationale:
			"No GGUF / SafeTensors primary file found in the repo. Pick a file manually if you know what to download.",
	};
}

/** Human-readable byte size — 1.2 GB, 450 MB, 820 KB, 42 B. */
export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Pick the largest-sized entry. Returns `undefined` if all sizes are `null`. */
function pickLargest(files: RepoFile[]): RepoFile | undefined {
	const sized = files.filter((f) => typeof f.size === "number");
	if (sized.length === 0) return undefined;
	return sized.reduce((best, f) => ((f.size ?? 0) > (best.size ?? 0) ? f : best));
}

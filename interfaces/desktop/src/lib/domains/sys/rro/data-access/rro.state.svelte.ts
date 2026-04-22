/**
 * @file RRO State Rune
 * @module @devpulse/domains/sys/rro/data-access
 *
 * Single reactive state container for the RRO devtool. Uses Svelte 5 runes
 * on a class — class-field runes are the 2026 idiomatic pattern for
 * shared domain state (per Svelte 5 docs + project rules).
 *
 * Grouped by capability. Each loader is idempotent and safe to call
 * multiple times (results update, errors captured per-slice).
 *
 * Routes never touch this directly — they import it via
 * `$lib/domains/sys/rro/index.js`.
 */

import { withAction } from "$lib/sys/action-bus.svelte.js";
import { logInfo } from "$lib/sys/logger.js";
import { describeError } from "../util/rro.format.js";
import { getPreset } from "../util/rro.presets.js";
import type {
	CollectionInfo,
	GraphHealthAll,
	GraphNamespace,
	GraphNamespaceStats,
	RetrievalConfig,
	RetrievalParamMeta,
	RroTabId,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "../util/rro.types.js";
import * as BrainSvc from "./brain.svc.js";
import * as EncoderSvc from "./encoder.svc.js";
import * as RroSvc from "./rro.svc.js";

const PERSIST_KEY = "rro:retrieval_config";
const BRAIN_NAMESPACES: GraphNamespace[] = ["System", "User", "Global"];

class RroState {
	// ── Tab ─────────────────────────────────────────────────
	activeTab = $state<RroTabId>("search");

	// ── Vector health ───────────────────────────────────────
	health = $state<VectorHealthReport | null>(null);
	healthError = $state<string | null>(null);
	healthLoading = $state(false);

	// ── Retrieval config ────────────────────────────────────
	config = $state<RetrievalConfig | null>(null);
	configError = $state<string | null>(null);

	// ── Parameter metadata ──────────────────────────────────
	paramMeta = $state<RetrievalParamMeta[]>([]);

	// ── Encoder ─────────────────────────────────────────────
	encoder = $state<SlotInfo | null>(null);
	encoderError = $state<string | null>(null);

	// ── Brain ───────────────────────────────────────────────
	brainHealth = $state<GraphHealthAll | null>(null);
	brainStats = $state<Record<string, GraphNamespaceStats>>({});
	brainError = $state<string | null>(null);
	brainLoading = $state(false);

	// ── Search test bench ───────────────────────────────────
	searchQuery = $state("");
	searchCollection = $state("");
	searchResults = $state<VectorSearchResult[]>([]);
	searchError = $state<string | null>(null);
	searchLoading = $state(false);
	embedLatencyMs = $state<number | null>(null);
	searchLatencyMs = $state<number | null>(null);

	// ── Collection management ───────────────────────────────
	newCollectionName = $state("");
	newCollectionDimension = $state(768);
	createLoading = $state(false);
	createError = $state<string | null>(null);
	deleteError = $state<string | null>(null);
	deleteConfirm = $state<string | null>(null);

	// ── Derived ─────────────────────────────────────────────
	collections = $derived<string[]>(
		this.health ? this.health.collections.map((c: CollectionInfo) => c.name) : [],
	);

	encoderReady = $derived<boolean>(!!this.encoder?.backend);

	// ── Tab ─────────────────────────────────────────────────
	setTab(t: RroTabId): void {
		if (this.activeTab === t) return;
		this.activeTab = t;
		logInfo("rro.state", `tab:${t}`);
	}

	// ── Loaders ─────────────────────────────────────────────
	async loadHealth(): Promise<void> {
		this.healthLoading = true;
		this.healthError = null;
		try {
			this.health = await withAction("rro.loadHealth", "Loading store health…", () =>
				RroSvc.getVectorHealth(),
			);
		} catch (e) {
			this.healthError = describeError(e);
		} finally {
			this.healthLoading = false;
		}
	}

	async loadConfig(): Promise<void> {
		this.configError = null;
		try {
			await withAction("rro.loadConfig", "Loading search tuning…", async () => {
				// Prefer persisted preference over runtime default.
				const { getPreference } = await import("$lib/sys/generated/bindings.js").then(
					(m) => m.commands,
				);
				const persisted = await getPreference(PERSIST_KEY);
				if (persisted.status === "ok" && persisted.data) {
					try {
						const saved = JSON.parse(persisted.data) as RetrievalConfig;
						await RroSvc.setRetrievalConfig(saved);
						this.config = saved;
						logInfo("rro.state", `restored persisted config: ${saved.preset}`);
						return;
					} catch {
						/* fall through to runtime default */
					}
				}
				this.config = await RroSvc.getRetrievalConfig();
			});
		} catch (e) {
			this.configError = describeError(e);
		}
	}

	async loadParamMeta(): Promise<void> {
		try {
			this.paramMeta = await withAction("rro.loadParamMeta", "Loading tuning parameters…", () =>
				RroSvc.getParamMeta(),
			);
		} catch {
			/* non-critical — UI falls back to generic slider labels */
		}
	}

	async loadEncoder(): Promise<void> {
		this.encoderError = null;
		try {
			this.encoder = await withAction("rro.loadEncoderStatus", "Checking encoder status…", () =>
				EncoderSvc.getEncoderSlot(),
			);
		} catch (e) {
			this.encoderError = describeError(e);
		}
	}

	async loadBrain(): Promise<void> {
		this.brainLoading = true;
		this.brainError = null;
		try {
			this.brainHealth = await withAction("rro.loadBrainHealth", "Checking Brain health…", () =>
				BrainSvc.getBrainHealth(),
			);
			if (this.brainHealth) {
				const reachable = this.brainHealth.namespaces.filter((n) => n.reachable);
				const statsEntries = await Promise.all(
					reachable.map(async (n) => {
						const ns = (n.namespace.charAt(0).toUpperCase() +
							n.namespace.slice(1)) as GraphNamespace;
						try {
							const s = await withAction(
								"rro.loadBrainStats",
								`Scanning ${ns.toLowerCase()} knowledge…`,
								() => BrainSvc.getBrainStats(ns),
							);
							return [ns, s] as const;
						} catch {
							return null;
						}
					}),
				);
				const next: Record<string, GraphNamespaceStats> = {};
				for (const entry of statsEntries) {
					if (entry) next[entry[0]] = entry[1];
				}
				this.brainStats = next;
			}
		} catch (e) {
			this.brainError = describeError(e);
		} finally {
			this.brainLoading = false;
		}
	}

	// ── Mutations ───────────────────────────────────────────
	async applyPreset(name: string): Promise<void> {
		const cfg = getPreset(name);
		if (!cfg) return;
		this.configError = null;
		try {
			await withAction("rro.applyPreset", `Switching to "${name}" preset…`, () =>
				RroSvc.setRetrievalConfig(cfg),
			);
			this.config = cfg;
			await this.persistConfig(cfg);
		} catch (e) {
			this.configError = describeError(e);
		}
	}

	async updateField(field: string, value: number): Promise<void> {
		if (!this.config) return;
		const updated: RetrievalConfig = { ...this.config, [field]: value, preset: "custom" };
		this.configError = null;
		try {
			await withAction("rro.updateField", `Adjusting ${field}…`, () =>
				RroSvc.setRetrievalConfig(updated),
			);
			this.config = updated;
			await this.persistConfig(updated);
		} catch (e) {
			this.configError = describeError(e);
		}
	}

	async createCollection(): Promise<void> {
		const name = this.newCollectionName.trim();
		if (!name) return;
		this.createError = null;
		this.createLoading = true;
		try {
			await withAction("rro.createCollection", `Creating store "${name}"…`, () =>
				RroSvc.createCollection(name, this.newCollectionDimension),
			);
			this.newCollectionName = "";
			await this.loadHealth();
		} catch (e) {
			this.createError = describeError(e);
		} finally {
			this.createLoading = false;
		}
	}

	async deleteCollection(name: string): Promise<void> {
		if (this.deleteConfirm !== name) {
			this.deleteConfirm = name;
			return;
		}
		this.deleteConfirm = null;
		this.deleteError = null;
		try {
			await withAction("rro.deleteCollection", `Deleting store "${name}"…`, () =>
				RroSvc.deleteCollection(name),
			);
			await this.loadHealth();
		} catch (e) {
			this.deleteError = describeError(e);
		}
	}

	async runSearch(): Promise<void> {
		const q = this.searchQuery.trim();
		if (!q || !this.searchCollection) return;
		this.searchLoading = true;
		this.searchError = null;
		this.searchResults = [];
		this.embedLatencyMs = null;
		this.searchLatencyMs = null;
		try {
			const t0 = performance.now();
			const vector = await withAction("rro.embedQuery", "Encoding your query…", () =>
				EncoderSvc.encodeText(q),
			);
			this.embedLatencyMs = Math.round(performance.now() - t0);

			const limit = this.config?.top_k ?? 10;
			const t2 = performance.now();
			const results = await withAction(
				"rro.testSearch",
				`Searching "${this.searchCollection}"…`,
				() => RroSvc.testSearch(this.searchCollection, vector, Math.min(limit, 50)),
			);
			this.searchLatencyMs = Math.round(performance.now() - t2);
			this.searchResults = results;
		} catch (e) {
			this.searchError = describeError(e);
		} finally {
			this.searchLoading = false;
		}
	}

	// ── Persistence ─────────────────────────────────────────
	private async persistConfig(config: RetrievalConfig): Promise<void> {
		const { commands } = await import("$lib/sys/generated/bindings.js");
		const r = await commands.setPreference(PERSIST_KEY, JSON.stringify(config));
		if (r.status === "error") {
			logInfo("rro.state", `persistConfig failed: ${r.error}`);
		}
	}

	// ── Exposed constants ───────────────────────────────────
	readonly brainNamespaces = BRAIN_NAMESPACES;

	// ── Mount hook ──────────────────────────────────────────
	async initialLoad(): Promise<void> {
		logInfo("rro.state", "devtool mounted — initial load");
		// Parallel — each catches its own errors.
		await Promise.all([
			this.loadHealth(),
			this.loadConfig(),
			this.loadParamMeta(),
			this.loadEncoder(),
		]);
		// Auto-select first collection for search if empty.
		if (this.collections.length > 0 && !this.searchCollection) {
			this.searchCollection = this.collections[0];
		}
	}
}

/** Single shared RRO state instance. Routes import this via the domain barrel. */
export const rroState = new RroState();

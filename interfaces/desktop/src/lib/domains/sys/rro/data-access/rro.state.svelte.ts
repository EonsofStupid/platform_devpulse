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

import type { UnlistenFn } from "@tauri-apps/api/event";
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
	RroDepth,
	RroStateSnapshot,
	RroTabId,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "../util/rro.types.js";
import * as BrainSvc from "./brain.svc.js";
import * as EncoderSvc from "./encoder.svc.js";
import * as RroSvc from "./rro.svc.js";
import * as RroStateSvc from "./rro_state.svc.js";

const PERSIST_KEY = "rro:retrieval_config";
const BRAIN_NAMESPACES: GraphNamespace[] = ["System", "User", "Global"];

class RroState {
	// ── Tab ─────────────────────────────────────────────────
	activeTab = $state<RroTabId>("state");

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

	// ── RRO state machine (live) ────────────────────────────
	rroSnapshot = $state<RroStateSnapshot | null>(null);
	rroStateError = $state<string | null>(null);
	rroStateLoading = $state(false);
	gatherSource = $state("manual");
	purgeReason = $state("stale");
	forkLabel = $state("alt");
	/** Per-action loading flags — drives per-button disabled + spinner. */
	rroActionLoading = $state<{
		depth: boolean;
		gather: boolean;
		purge: boolean;
		fork: boolean;
		proximity: boolean;
	}>({ depth: false, gather: false, purge: false, fork: false, proximity: false });
	/** Handle returned by Tauri listen() — called during teardown. */
	private rroUnlisten: UnlistenFn | null = null;

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

	// ── RRO state machine loaders + mutations ──────────────
	async loadRroState(): Promise<void> {
		this.rroStateLoading = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction("rro.loadRroState", "Reading reasoning state…", () =>
				RroStateSvc.getRroState(),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroStateLoading = false;
		}
	}

	async setDepth(depth: RroDepth): Promise<void> {
		if (this.rroActionLoading.depth) return;
		this.rroActionLoading.depth = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction("rro.setDepth", `Setting depth to ${depth}…`, () =>
				RroStateSvc.setRroDepth(depth),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroActionLoading.depth = false;
		}
	}

	async triggerGather(): Promise<void> {
		if (this.rroActionLoading.gather) return;
		const source = this.gatherSource.trim() || "manual";
		this.rroActionLoading.gather = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction("rro.triggerGather", `Gathering from "${source}"…`, () =>
				RroStateSvc.triggerGather(source),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroActionLoading.gather = false;
		}
	}

	async triggerPurge(): Promise<void> {
		if (this.rroActionLoading.purge) return;
		const reason = this.purgeReason.trim() || "stale";
		this.rroActionLoading.purge = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction("rro.triggerPurge", `Clearing context (${reason})…`, () =>
				RroStateSvc.triggerPurge(reason),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroActionLoading.purge = false;
		}
	}

	async triggerFork(): Promise<void> {
		if (this.rroActionLoading.fork) return;
		const label = this.forkLabel.trim() || "alt";
		this.rroActionLoading.fork = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction("rro.triggerFork", `Branching to "${label}"…`, () =>
				RroStateSvc.triggerFork(label),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroActionLoading.fork = false;
		}
	}

	async setProximity(value: number): Promise<void> {
		if (this.rroActionLoading.proximity) return;
		this.rroActionLoading.proximity = true;
		this.rroStateError = null;
		try {
			this.rroSnapshot = await withAction(
				"rro.setProximity",
				`Setting proximity to ${value.toFixed(2)}…`,
				() => RroStateSvc.setProximity(value),
			);
		} catch (e) {
			this.rroStateError = describeError(e);
		} finally {
			this.rroActionLoading.proximity = false;
		}
	}

	/** Begin listening for live transitions. Idempotent. */
	async subscribeRroState(): Promise<void> {
		if (this.rroUnlisten) return;
		this.rroUnlisten = await RroStateSvc.subscribeRroState((snapshot) => {
			this.rroSnapshot = snapshot;
			logInfo("rro.state", `live ← state=${snapshot.state} depth=${snapshot.depth}`);
		});
		logInfo("rro.state", "subscribed to platform:rro-state-changed");
	}

	/** Tear down the listener. Called when the devtool window closes. */
	teardownRroState(): void {
		if (this.rroUnlisten) {
			this.rroUnlisten();
			this.rroUnlisten = null;
			logInfo("rro.state", "unsubscribed from platform:rro-state-changed");
		}
	}

	// ── Mount hook ──────────────────────────────────────────
	async initialLoad(): Promise<void> {
		logInfo("rro.state", "devtool mounted — initial load");
		// Parallel — each catches its own errors.
		await Promise.all([
			this.loadHealth(),
			this.loadConfig(),
			this.loadParamMeta(),
			this.loadEncoder(),
			this.loadRroState(),
			this.subscribeRroState(),
		]);
		// Auto-select first collection for search if empty.
		if (this.collections.length > 0 && !this.searchCollection) {
			this.searchCollection = this.collections[0];
		}
	}
}

/** Single shared RRO state instance. Routes import this via the domain barrel. */
export const rroState = new RroState();

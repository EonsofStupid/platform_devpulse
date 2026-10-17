<!--
	@file IntelligenceDevtool.svelte
	@module @devpulse/devtools/clyffy/memory/intelligence
	@window DevTools (Ctrl+Shift+Q)

	Layman terminology: "Memory Intelligence". Surfaces the embedding-
	indexed memory + RRO archive layer that lives under
	`projects/<slug>` SurrealDB namespaces. Read-only in V1 — every
	tab inspects state already on disk; destructive verbs (wipe,
	rebuild HNSW) land alongside the hook + MCP integration in a
	follow-up slice.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Database, HardDrive, RefreshCw, Sparkles } from "lucide-svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ScopedLogPanel, ServiceDevtoolShell } from "$lib/devtools/index.js";
import IntelligenceMemoryStream from "./IntelligenceMemoryStream.svelte";

// ─── Local DTOs (mirror Rust commands::intelligence::*) ───
//
// Inline interfaces avoid the regen-bindings dependency so the
// devtool compiles independently of the next `cargo xtask
// regen-bindings` run. Migrate to
// `$lib/sys/generated/bindings.js` once regen has run.
interface IntelStatus {
	connector_kind: string;
	embedding_dim: number;
	project_count: number;
}

interface ProjectIntel {
	slug: string;
	memory_count: number;
	archive_count: number;
}

let intelStatus = $state<IntelStatus | null>(null);
let projects = $state<ProjectIntel[]>([]);
let loading = $state(false);
let loadError = $state<string | null>(null);

// Bucket-prediction probe (Debug tab) — surfaces
// `infer_download_folder` so an operator can see how a model
// filename WOULD be classified before triggering a download.
let probeFilename = $state("bge-reranker-v2-m3.gguf");
let probeBucket = $state<string | null>(null);
let probeError = $state<string | null>(null);

const badge = $derived<HealthBadge>(
	intelStatus === null
		? { state: "stopped", label: "Loading…" }
		: intelStatus.project_count === 0
			? { state: "degraded", label: "No projects bootstrapped yet" }
			: { state: "up", label: `${intelStatus.project_count} projects` },
);

async function refresh(): Promise<void> {
	loading = true;
	loadError = null;
	try {
		const [s, p] = await Promise.all([
			invoke<IntelStatus>("intel_status"),
			invoke<ProjectIntel[]>("intel_list_projects"),
		]);
		intelStatus = s;
		projects = p;
	} catch (e) {
		loadError = String(e);
	} finally {
		loading = false;
	}
}

async function probe(): Promise<void> {
	probeError = null;
	probeBucket = null;
	try {
		probeBucket = await invoke<string>("infer_capability_bucket", {
			filename: probeFilename,
		});
	} catch (e) {
		probeError = String(e);
	}
}

onMount(refresh);
</script>

<ServiceDevtoolShell
	health={badge}
>
	{#snippet status()}
		<div class="space-y-4">
			<div class="flex items-center gap-2">
				<Button onclick={refresh} preset="ghost" size="sm" disabled={loading}>
					{#if loading}
						<Spinner size="xs" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
				{#if loadError}
					<Text size="xs" color="danger">{loadError}</Text>
				{/if}
			</div>

			{#if intelStatus}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div
						class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-1"
					>
						<Text size="xs" color="muted">Connector</Text>
						<Text size="sm" weight="semibold">{intelStatus.connector_kind}</Text>
					</div>
					<div
						class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-1"
					>
						<Text size="xs" color="muted">Embedding dim</Text>
						<Text size="sm" weight="semibold">{intelStatus.embedding_dim}</Text>
					</div>
					<div
						class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-1"
					>
						<Text size="xs" color="muted">Projects</Text>
						<Text size="sm" weight="semibold">{intelStatus.project_count}</Text>
					</div>
				</div>

				<div class="space-y-2">
					<Text size="sm" weight="semibold">
						Project namespaces under <code>projects/</code>
					</Text>
					{#if projects.length === 0}
						<Text size="xs" color="muted">
							No project has bootstrapped its intelligence schema yet. The
							first call to <code>init_project</code> from a hook or MCP
							consumer creates a row here.
						</Text>
					{:else}
						<div
							class="rounded-lg border border-[var(--border-subtle)] overflow-hidden"
						>
							<table class="w-full text-sm">
								<thead class="bg-[var(--surface-muted)]">
									<tr>
										<th class="text-left px-3 py-2 font-medium">Slug</th>
										<th class="text-right px-3 py-2 font-medium">Memories</th>
										<th class="text-right px-3 py-2 font-medium">Archives</th>
									</tr>
								</thead>
								<tbody>
									{#each projects as p}
										<tr class="border-t border-[var(--border-subtle)]">
											<td class="px-3 py-2 font-mono text-xs">{p.slug}</td>
											<td class="text-right px-3 py-2">{p.memory_count}</td>
											<td class="text-right px-3 py-2">{p.archive_count}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<div
				class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-2"
			>
				<div class="flex items-center gap-2">
					<Database size={14} style="color: var(--accent-service-main)" />
					<Text size="sm" weight="semibold">Schema (per-project)</Text>
				</div>
				<Text size="xs" color="muted">
					Two tables under <code>projects/&lt;slug&gt;</code>:
					<code>memories</code> with HNSW-indexed
					<code>embedding</code> column (384-dim, cosine distance) and
					<code>rro_archive</code> sidecar holding rkyv-archived
					reasoning bytes for zero-copy reads.
				</Text>
			</div>

			<div
				class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-2"
			>
				<div class="flex items-center gap-2">
					<Sparkles size={14} style="color: var(--accent-service-main)" />
					<Text size="sm" weight="semibold">Embedder</Text>
				</div>
				<Text size="xs" color="muted">
					CandleEmbedder, BERT family — defaults to
					<code>all-MiniLM-L6-v2</code> at 384 dims. Replacing the
					embedder requires re-initializing every per-project namespace
					because the HNSW dimension is locked at table-definition
					time.
				</Text>
			</div>

			<div
				class="p-3 rounded-lg border border-[var(--border-subtle)] space-y-2"
			>
				<div class="flex items-center gap-2">
					<HardDrive size={14} style="color: var(--accent-service-main)" />
					<Text size="sm" weight="semibold">Storage</Text>
				</div>
				<Text size="xs" color="muted">
					Embedded SurrealKV — zero network, file-locked by the
					Platform. Cloud connector (`surreal_cloud`) ships in a
					follow-up slice gated on
					<code>connector-surreal-cloud</code>.
				</Text>
			</div>
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-4">
			<IntelligenceMemoryStream />
			<ScopedLogPanel target="intelligence" />
		</div>
	{/snippet}

	{#snippet actions()}
		<Text size="sm" color="muted">
			V1 is read-only. Destructive verbs (wipe project memories,
			rebuild HNSW index, recompute embeddings) land alongside the
			hook + MCP integration once the boot path can guarantee a
			clean snapshot before each verb. The constraint is intentional
			— exposing wipe before guardrails are in place is exactly the
			kind of devtool footgun the locked rules call out.
		</Text>
	{/snippet}

	{#snippet debug()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Text size="sm" weight="semibold">Capability-bucket inference</Text>
				<Text size="xs" color="muted">
					Wraps <code>model_loader::infer_download_folder</code>.
					Type any model filename and see how the keyword router
					would route it to a download bucket — useful for
					verifying classification before a download lands.
				</Text>

				<div class="flex gap-2 items-center">
					<input
						bind:value={probeFilename}
						type="text"
						placeholder="bge-reranker-v2-m3.gguf"
						class="flex-1 px-2 py-1 rounded border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-sm font-mono"
					/>
					<Button onclick={probe} preset="primary" size="sm">Probe</Button>
				</div>

				{#if probeError}
					<Text size="xs" color="danger">{probeError}</Text>
				{:else if probeBucket}
					<div
						class="p-2 rounded-lg border border-[var(--border-subtle)] flex items-baseline gap-2"
					>
						<Text size="xs" color="muted">→</Text>
						<Text size="sm" weight="semibold">{probeBucket}</Text>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>

<!--
	@component EngineFoundationCard
	@module @devpulse/devtools/runtimes/inference/llama-cpp

	Polished hero panel for the FFI llama.cpp prebuilt foundation.
	Surfaces three things in layman terms:

	1. Whether the inference engine is ready (link-mode badge)
	2. Which engine pack version + upstream snapshot is pinned
	3. Per-build status (installed / available / active / update available)

	Mirrors the visual language of [StoreHeroCard] — accent stripe,
	icon tile, name row with health badge, body grid — so the
	`/devtools/runtimes/inference/*` family feels consistent with
	`/devtools/system/datastores/*`. Accent var defaults to the
	hot-pink that the llama.cpp shell already uses.

	No inline Tailwind grids. No raw inline styles in the markup.
	All sizing via design-system tokens (Text size props +
	clamp()-based CSS custom properties).
-->
<script lang="ts">
import { ExternalLink, FolderOpen, RefreshCw, Sparkles } from "@lucide/svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { KeyValue } from "$lib/design/components/key-value/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { LinkMode, LlamaCppBuildInfo, TargetState } from "$lib/sys/generated/bindings.js";

interface Props {
	/** Snapshot from `commands.llamaCppBuildInfo()`. */
	buildInfo: LlamaCppBuildInfo;
	/** Open OS file manager at this build's install location. */
	onOpenLocation: (target: string) => void;
	/** Optional: which target's open is currently in flight (disables button). */
	openingTarget?: string | null;
	/** Accent CSS variable. Defaults to the hot-pink the shell already uses. */
	accentVar?: string;
}

let {
	buildInfo,
	onOpenLocation,
	openingTarget = null,
	accentVar = "--accent-hotpink",
}: Props = $props();

// ── Layman label translations ────────────────────────────────────
// Engineering-grade target ids (`win32-x64-vulkan`) become customer-
// readable build flavors. SSOT lives here for the panel — if a third
// kind shows up, add it here, NOT inline at the call site.
const TARGET_LABELS: Record<string, { name: string; tagline: string }> = {
	"win32-x64-vulkan": {
		name: "Windows · GPU (universal)",
		tagline: "Vulkan — works on AMD, NVIDIA, and Intel graphics cards",
	},
	"win32-x64-cuda": {
		name: "Windows · GPU (NVIDIA fast path)",
		tagline: "CUDA — fastest on NVIDIA cards; falls back to universal otherwise",
	},
	"win32-x64-cpu": {
		name: "Windows · CPU only",
		tagline: "No graphics card needed; slower than the GPU builds",
	},
};

const LINK_MODE_BADGE: Record<
	LinkMode,
	{ label: string; tone: "positive" | "notice" | "neutral" }
> = {
	prebuilt: { label: "Engine ready", tone: "positive" },
	"prebuilt-staged-but-not-exported": {
		label: "Engine staged · restart to activate",
		tone: "notice",
	},
	"fallback-cmake-or-unbuilt": {
		label: "Engine not installed",
		tone: "notice",
	},
};

const linkBadge = $derived(LINK_MODE_BADGE[buildInfo.link_mode]);

function targetLabel(target: string): { name: string; tagline: string } {
	return TARGET_LABELS[target] ?? { name: target, tagline: "" };
}

function targetState(t: TargetState): {
	label: string;
	tone: "positive" | "notice" | "accent" | "neutral";
} {
	if (buildInfo.active_target === t.target) return { label: "Active", tone: "accent" };
	if (t.drift) return { label: "Update available", tone: "notice" };
	if (t.extracted) return { label: "Installed", tone: "positive" };
	return { label: "Available", tone: "neutral" };
}
</script>

<section class="engine-card" style={`--engine-accent: var(${accentVar});`}>
	<div class="accent-stripe"></div>

	<div class="engine-body">
		<header class="engine-header">
			<div class="icon-tile">
				<Sparkles size={28} class="engine-icon" />
			</div>
			<div class="header-text">
				<div class="name-row">
					<Text size="lg" weight="bold">Inference engine</Text>
					<Badge variant={linkBadge.tone} size="sm">{linkBadge.label}</Badge>
				</div>
				<Text size="sm" color="muted">
					Built once, embedded directly in DevPulse — no per-machine rebuild.
				</Text>
			</div>
		</header>

		<div class="meta-grid">
			<KeyValue label="Engine pack" value={buildInfo.manifest_tag} size="sm" />
			<KeyValue
				label="Engine snapshot"
				value={buildInfo.upstream_sha.slice(0, 12)}
				size="sm"
			/>
			<KeyValue
				label="Active build"
				value={buildInfo.active_target ? targetLabel(buildInfo.active_target).name : "— none active"}
				size="sm"
			/>
		</div>

		{#if buildInfo.release_url}
			<a
				class="release-link"
				href={buildInfo.release_url}
				target="_blank"
				rel="noreferrer"
			>
				<Text size="xs">View this engine pack on GitHub</Text>
				<ExternalLink size={12} />
			</a>
		{/if}

		<div class="targets">
			<Text size="xs" weight="bold" color="muted">Available builds</Text>
			{#each buildInfo.targets as t (t.target)}
				{@const meta = targetLabel(t.target)}
				{@const state = targetState(t)}
				{@const isActive = buildInfo.active_target === t.target}
				<article class="target-row" class:is-active={isActive}>
					<div class="target-text">
						<div class="target-name-row">
							<Text size="sm" weight="semibold">{meta.name}</Text>
							<Badge variant={state.tone} size="sm">{state.label}</Badge>
						</div>
						{#if meta.tagline}
							<Text size="xs" color="muted">{meta.tagline}</Text>
						{/if}
					</div>
					<div class="target-actions">
						{#if t.extracted}
							<Button
								preset="ghost"
								size="sm"
								onclick={() => onOpenLocation(t.target)}
								disabled={openingTarget === t.target}
							>
								<FolderOpen size={12} />
								Open location
							</Button>
						{:else}
							<Text size="xs" color="muted">
								Install via Actions tab
							</Text>
						{/if}
					</div>
				</article>
			{/each}
		</div>

		<footer class="engine-footer">
			<RefreshCw size={11} class="footer-icon" />
			<Text size="xs" color="muted">
				When upstream releases a newer pack, the Actions tab offers a one-click bump.
				Each install is sha256-verified before it links into DevPulse.
			</Text>
		</footer>
	</div>
</section>

<style>
	.engine-card {
		position: relative;
		display: flex;
		border-radius: 0.625rem;
		overflow: hidden;
		background: linear-gradient(
			135deg,
			var(--surface-raised) 0%,
			color-mix(in oklch, var(--engine-accent) 4%, var(--surface-raised)) 100%
		);
		border: 1px solid color-mix(in oklch, var(--engine-accent) 25%, var(--border-subtle));
		box-shadow: 0 0.125rem 0.75rem color-mix(in oklch, var(--engine-accent) 8%, transparent);
	}
	.accent-stripe {
		width: 0.25rem;
		background: linear-gradient(
			180deg,
			var(--engine-accent) 0%,
			color-mix(in oklch, var(--engine-accent) 60%, transparent) 100%
		);
		flex-shrink: 0;
	}
	.engine-body {
		flex: 1;
		padding: clamp(0.875rem, 1.4vw, 1.25rem);
		display: flex;
		flex-direction: column;
		gap: clamp(0.75rem, 1.2vw, 1rem);
		min-width: 0;
	}
	.engine-header {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
	}
	.icon-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--engine-accent) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--engine-accent) 28%, transparent);
		flex-shrink: 0;
	}
	:global(.engine-icon) {
		color: var(--engine-accent);
	}
	.header-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.name-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.meta-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
		gap: clamp(0.5rem, 1vw, 0.875rem);
		padding: clamp(0.625rem, 1vw, 0.875rem);
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--engine-accent) 4%, var(--surface-base));
		border: 1px solid var(--border-subtle);
	}

	.release-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		align-self: flex-start;
		color: var(--engine-accent);
		text-decoration: none;
		padding: 0.125rem 0;
		border-bottom: 1px solid transparent;
		transition: border-color 120ms ease;
	}
	.release-link:hover {
		border-bottom-color: color-mix(in oklch, var(--engine-accent) 50%, transparent);
	}

	.targets {
		display: flex;
		flex-direction: column;
		gap: clamp(0.375rem, 0.7vw, 0.5rem);
	}
	.target-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.875rem;
		padding: clamp(0.5rem, 0.9vw, 0.75rem) clamp(0.625rem, 1vw, 0.875rem);
		border-radius: 0.5rem;
		background: var(--surface-base);
		border: 1px solid var(--border-subtle);
		transition: border-color 120ms ease, background 120ms ease;
	}
	.target-row.is-active {
		border-color: color-mix(in oklch, var(--engine-accent) 55%, transparent);
		background: color-mix(in oklch, var(--engine-accent) 6%, var(--surface-base));
	}
	.target-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.target-name-row {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		flex-wrap: wrap;
	}
	.target-actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
	}

	.engine-footer {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding-top: clamp(0.25rem, 0.5vw, 0.5rem);
		border-top: 1px dashed var(--border-subtle);
	}
	:global(.footer-icon) {
		color: var(--text-muted);
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
</style>

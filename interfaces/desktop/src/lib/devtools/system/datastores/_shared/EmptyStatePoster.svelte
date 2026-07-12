<!--
	@component EmptyStatePoster
	@module @devpulse/devtools/system/datastores/_shared

	Friendly empty state for a datastore devtool panel. Replaces
	"Click Refresh to load tables" plain-text patterns with a centered
	illustration + diagnostic hint pointing at the scoped-log target
	that would reveal *why* the data is empty.

	Per the locked feedback rule `devtools_are_dev_diagnostics`:
	empty states are bug states. They MUST point at where the
	diagnosis lives, not just say "empty."

	## Usage

	```svelte
	<EmptyStatePoster
	  icon={Database}
	  title="No tables found yet"
	  hint="If you expected rows here, check the log target below."
	  logTarget="duckdb.lifecycle"
	  accentVar="--accent-gold-main"
	/>
	```
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/**
	 * Lucide icon component. Typed `any` because lucide-svelte v0.564
	 * exports class-based icons (`SvelteComponentTyped<…>`), which
	 * structurally don't satisfy Svelte 5's function-form
	 * `Component<P, E, S>`.
	 */
	// biome-ignore lint/suspicious/noExplicitAny: lucide-svelte class-based exports don't match Svelte 5 `Component<P>` function-form structurally.
	icon: any;
	/** Layman-friendly headline. Not "empty" — explain what wasn't found. */
	title: string;
	/** One-line hint pointing at why this could be empty. */
	hint?: string;
	/** Scoped-log target the operator should grep when diagnosing. */
	logTarget?: string;
	/** Accent CSS variable (full token, with -main suffix),
	 *  e.g. "--accent-gold-main" for DuckDB. */
	accentVar?: string;
}

let {
	icon: Icon,
	title,
	hint = undefined,
	logTarget = undefined,
	accentVar = "--accent-electric-main",
}: Props = $props();
</script>

<div class="empty-state" style={`--store-accent: var(${accentVar});`}>
	<div class="icon-frame">
		<Icon size={48} class="icon-faded" />
	</div>
	<Text size="sm" weight="semibold" class="title">{title}</Text>
	{#if hint}
		<Text size="xs" color="muted" class="hint">{hint}</Text>
	{/if}
	{#if logTarget}
		<Text size="xs" color="muted" class="log-target">
			Diagnose: <code>{logTarget}</code>
		</Text>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 2rem 1.5rem;
		text-align: center;
	}
	.icon-frame {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: color-mix(in oklch, var(--store-accent) 8%, transparent);
		border: 1px solid color-mix(in oklch, var(--store-accent) 20%, transparent);
		margin-bottom: 0.25rem;
	}
	:global(.icon-faded) {
		color: var(--store-accent);
		opacity: 0.55;
	}
	:global(.empty-state .title) {
		max-width: 28rem;
	}
	:global(.empty-state .hint) {
		max-width: 24rem;
		line-height: 1.4;
	}
	:global(.empty-state .log-target) {
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		opacity: 0.8;
	}
	:global(.empty-state .log-target code) {
		background: color-mix(in oklch, var(--store-accent) 8%, transparent);
		padding: 0.0625rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid color-mix(in oklch, var(--store-accent) 20%, transparent);
	}
</style>

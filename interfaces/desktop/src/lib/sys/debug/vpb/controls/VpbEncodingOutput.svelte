<!--
	@file VpbEncodingOutput — Live Encoding + CSS Output Display
	@layer vpb

	Shows the live-resolved output from the current VPB visual state:
	- Encoding string (v-s1d2g1)
	- Tailwind segment classes (v-s1 v-d2 v-g1)
	- Resolved CSS custom properties
	- Copy-to-clipboard for each
-->
<script lang="ts">
	import type { ResolvedVisual } from "$lib/design/registry/resolve-visual.js";

	let {
		resolved,
	}: {
		resolved: ResolvedVisual;
	} = $props();

	let copied = $state<string | null>(null);

	function copyToClipboard(text: string, label: string) {
		navigator.clipboard.writeText(text).then(() => {
			copied = label;
			setTimeout(() => { copied = null; }, 1200);
		});
	}

	const cssEntries = $derived(Object.entries(resolved.cssProperties));
</script>

<div class="vpb-output">
	<!-- Encoding String -->
	<div class="vpb-output__section">
		<div class="vpb-output__header">
			<span class="vpb-output__label">Encoding</span>
			<button
				class="vpb-output__copy"
				onclick={() => copyToClipboard(resolved.encoding || "", "encoding")}
			>{copied === "encoding" ? "Copied!" : "Copy"}</button>
		</div>
		<code class="vpb-output__code vpb-output__code--encoding">
			{resolved.encoding || "(all defaults)"}
		</code>
	</div>

	<!-- Segments -->
	<div class="vpb-output__section">
		<div class="vpb-output__header">
			<span class="vpb-output__label">Segments</span>
			<button
				class="vpb-output__copy"
				onclick={() => copyToClipboard(resolved.segments, "segments")}
			>{copied === "segments" ? "Copied!" : "Copy"}</button>
		</div>
		<code class="vpb-output__code">
			{resolved.segments || "(no segments)"}
		</code>
	</div>

	<!-- Radius + Size -->
	<div class="vpb-output__section">
		<div class="vpb-output__header">
			<span class="vpb-output__label">Structural</span>
		</div>
		<div class="vpb-output__row">
			<span class="vpb-output__key">radius</span>
			<code class="vpb-output__val">{resolved.radius}</code>
		</div>
		<div class="vpb-output__row">
			<span class="vpb-output__key">size</span>
			<code class="vpb-output__val">{resolved.size}</code>
		</div>
	</div>

	<!-- CSS Properties -->
	{#if cssEntries.length > 0}
		<div class="vpb-output__section">
			<div class="vpb-output__header">
				<span class="vpb-output__label">CSS Properties ({cssEntries.length})</span>
				<button
					class="vpb-output__copy"
					onclick={() => {
						const css = cssEntries.map(([k, v]) => `${k}: ${v};`).join("\n");
						copyToClipboard(css, "css");
					}}
				>{copied === "css" ? "Copied!" : "Copy"}</button>
			</div>
			<div class="vpb-output__css">
				{#each cssEntries as [prop, value]}
					<div class="vpb-output__row">
						<span class="vpb-output__key">{prop}</span>
						<code class="vpb-output__val">{value}</code>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.vpb-output {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.vpb-output__section {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 6px;
		border: 1px solid oklch(1 0 0 / 0.06);
		border-radius: 4px;
		background: oklch(0 0 0 / 0.3);
	}
	.vpb-output__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.vpb-output__label {
		font-size: 9px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: oklch(0.55 0 0);
	}
	.vpb-output__copy {
		font-size: 9px;
		padding: 1px 5px;
		border: 1px solid oklch(1 0 0 / 0.1);
		border-radius: 3px;
		background: oklch(1 0 0 / 0.04);
		color: oklch(0.6 0 0);
		cursor: pointer;
	}
	.vpb-output__copy:hover {
		background: oklch(1 0 0 / 0.08);
		color: oklch(0.8 0 0);
	}
	.vpb-output__code {
		font-family: var(--font-mono, monospace);
		font-size: 11px;
		color: oklch(0.75 0.1 180);
		word-break: break-all;
	}
	.vpb-output__code--encoding {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.vpb-output__css {
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-height: 150px;
		overflow-y: auto;
	}
	.vpb-output__row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 6px;
	}
	.vpb-output__key {
		font-size: 10px;
		color: oklch(0.6 0.06 280);
		flex-shrink: 0;
	}
	.vpb-output__val {
		font-family: var(--font-mono, monospace);
		font-size: 10px;
		color: oklch(0.7 0.08 140);
		text-align: right;
		word-break: break-all;
	}
</style>

<!--
	@file VpbEncodingOutput — Live Visual + CSS Output Display
	@layer vpb

	Shows the live-resolved output from the current VPB visual state:
	- The axis props set (surface=glass-deep depth=z2)
	- renderForge's preset and data attributes
	- The canonical variables the axis props override
	- Every resolved CSS custom property
	- Copy-to-clipboard for the props and the CSS
-->
<script lang="ts">
import type { NodeVisual } from "../registry/vpb-axes.js";

let {
	resolved,
	encoding,
}: {
	/** The selected node's visual: renderForge output + axis overrides */
	resolved: NodeVisual;
	/** The axis props set, as `axis=value` pairs */
	encoding: string;
} = $props();

let copied = $state<string | null>(null);

function copyToClipboard(text: string, label: string) {
	navigator.clipboard.writeText(text).then(() => {
		copied = label;
		setTimeout(() => {
			copied = null;
		}, 1200);
	});
}

const cssEntries = $derived(Object.entries({ ...resolved.macro.cssVars, ...resolved.overrides }));
const overrideEntries = $derived(Object.entries(resolved.overrides));
const attrEntries = $derived(Object.entries(resolved.dataAttrs));
</script>

<div class="vpb-output">
	<!-- Axis props -->
	<div class="vpb-output__section">
		<div class="vpb-output__header">
			<span class="vpb-output__label">Axis props</span>
			<button
				class="vpb-output__copy"
				onclick={() => copyToClipboard(encoding, "encoding")}
			>{copied === "encoding" ? "Copied!" : "Copy"}</button>
		</div>
		<code class="vpb-output__code vpb-output__code--encoding">{encoding}</code>
	</div>

	<!-- Preset + data attributes -->
	<div class="vpb-output__section">
		<div class="vpb-output__header">
			<span class="vpb-output__label">renderForge</span>
		</div>
		<div class="vpb-output__row">
			<span class="vpb-output__key">preset</span>
			<code class="vpb-output__val">{resolved.preset}</code>
		</div>
		{#each attrEntries as [name, value] (name)}
			<div class="vpb-output__row">
				<span class="vpb-output__key">{name}</span>
				<code class="vpb-output__val">{value === "" ? "(present)" : value}</code>
			</div>
		{/each}
	</div>

	<!-- Overrides -->
	{#if overrideEntries.length > 0}
		<div class="vpb-output__section">
			<div class="vpb-output__header">
				<span class="vpb-output__label">Axis overrides ({overrideEntries.length})</span>
			</div>
			<div class="vpb-output__css">
				{#each overrideEntries as [prop, value] (prop)}
					<div class="vpb-output__row">
						<span class="vpb-output__key">{prop}</span>
						<code class="vpb-output__val">{value}</code>
					</div>
				{/each}
			</div>
		</div>
	{/if}

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
				{#each cssEntries as [prop, value] (prop)}
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
		border: 1px solid var(--vpb-border);
		border-radius: 4px;
		background: var(--overlay-bg);
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
		color: var(--vpb-label-color);
	}
	.vpb-output__copy {
		font-size: 9px;
		padding: 1px 5px;
		border: 1px solid var(--vpb-btn-border);
		border-radius: 3px;
		background: var(--vpb-btn-bg);
		color: var(--vpb-value-color);
		cursor: pointer;
	}
	.vpb-output__copy:hover {
		background: var(--vpb-btn-hover);
		color: var(--vpb-text-bright);
	}
	.vpb-output__code {
		font-family: var(--font-mono, monospace);
		font-size: 11px;
		color: var(--vpb-encoding-teal);
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
		color: var(--vpb-encoding-purple);
		flex-shrink: 0;
	}
	.vpb-output__val {
		font-family: var(--font-mono, monospace);
		font-size: 10px;
		color: var(--vpb-encoding-green);
		text-align: right;
		word-break: break-all;
	}
</style>

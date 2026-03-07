<!--
	@file VPB Contract Inspector — Read-Only Contract View
	@layer vpb

	Shows the selected node's primitive contract metadata:
	slots, states, ARIA role, keyboard interactions, focus strategy.
	Pulled from manifest data.
-->
<script lang="ts">
	import type { ManifestPrimitive, ManifestComponent } from "$lib/design/scanner.types.js";

	let {
		primitive,
		component,
	}: {
		primitive?: ManifestPrimitive;
		component?: ManifestComponent;
	} = $props();
</script>

<div class="vpb-inspector">
	{#if !primitive && !component}
		<div class="vpb-inspector__empty">
			No contract found for this kind.
			<span class="vpb-inspector__hint">Run the scanner to generate the manifest.</span>
		</div>
	{:else}
		{#if primitive}
			<section class="vpb-inspector__section">
				<h4 class="vpb-inspector__heading">ARIA</h4>
				<div class="vpb-inspector__row">
					<span class="vpb-inspector__label">Role</span>
					<code class="vpb-inspector__value">{primitive.aria.role}</code>
				</div>
				<div class="vpb-inspector__row">
					<span class="vpb-inspector__label">Provider</span>
					<code class="vpb-inspector__value">{primitive.ariaStateProvider}</code>
				</div>
				<div class="vpb-inspector__row">
					<span class="vpb-inspector__label">Focus</span>
					<code class="vpb-inspector__value">{primitive.focusStrategy}</code>
				</div>
				{#if primitive.orientation}
					<div class="vpb-inspector__row">
						<span class="vpb-inspector__label">Orientation</span>
						<code class="vpb-inspector__value">{primitive.orientation}</code>
					</div>
				{/if}
				{#if primitive.compound}
					<div class="vpb-inspector__row">
						<span class="vpb-inspector__label">Compound</span>
						<code class="vpb-inspector__value">yes</code>
					</div>
				{/if}
			</section>

			<section class="vpb-inspector__section">
				<h4 class="vpb-inspector__heading">Slots</h4>
				<div class="vpb-inspector__tags">
					{#each primitive.slots.required as slot}
						<span class="vpb-inspector__tag vpb-inspector__tag--required">{slot}</span>
					{/each}
					{#each primitive.slots.optional as slot}
						<span class="vpb-inspector__tag vpb-inspector__tag--optional">{slot}</span>
					{/each}
				</div>
			</section>

			<section class="vpb-inspector__section">
				<h4 class="vpb-inspector__heading">States</h4>
				<div class="vpb-inspector__tags">
					{#each primitive.states.shared as state}
						<span class="vpb-inspector__tag vpb-inspector__tag--state">{state}</span>
					{/each}
					{#each primitive.states.specific as state}
						<span class="vpb-inspector__tag vpb-inspector__tag--state-specific">{state}</span>
					{/each}
				</div>
			</section>

			{#if primitive.keyboard.length > 0}
				<section class="vpb-inspector__section">
					<h4 class="vpb-inspector__heading">Keyboard</h4>
					<div class="vpb-inspector__tags">
						{#each primitive.keyboard as key}
							<kbd class="vpb-inspector__kbd">{key}</kbd>
						{/each}
					</div>
				</section>
			{/if}

			{#if primitive.aria.requiredAttrs.length > 0}
				<section class="vpb-inspector__section">
					<h4 class="vpb-inspector__heading">Required ARIA Attrs</h4>
					<div class="vpb-inspector__tags">
						{#each primitive.aria.requiredAttrs as attr}
							<code class="vpb-inspector__attr">{attr}</code>
						{/each}
					</div>
				</section>
			{/if}

			{#if primitive.dismissBehavior}
				<section class="vpb-inspector__section">
					<h4 class="vpb-inspector__heading">Dismiss</h4>
					<div class="vpb-inspector__row">
						<span class="vpb-inspector__label">Escape</span>
						<code class="vpb-inspector__value">{primitive.dismissBehavior.escape ? "yes" : "no"}</code>
					</div>
					<div class="vpb-inspector__row">
						<span class="vpb-inspector__label">Outside Click</span>
						<code class="vpb-inspector__value">{primitive.dismissBehavior.outsideClick ? "yes" : "no"}</code>
					</div>
				</section>
			{/if}
		{/if}

		{#if component}
			<section class="vpb-inspector__section">
				<h4 class="vpb-inspector__heading">Component</h4>
				<p class="vpb-inspector__desc">{component.description}</p>
				{#if component.apgPattern}
					<div class="vpb-inspector__row">
						<span class="vpb-inspector__label">APG Pattern</span>
						<code class="vpb-inspector__value">{component.apgPattern}</code>
					</div>
				{/if}
			</section>

			{#if component.keyboard.length > 0}
				<section class="vpb-inspector__section">
					<h4 class="vpb-inspector__heading">Component Keyboard</h4>
					<div class="vpb-inspector__kbd-list">
						{#each component.keyboard as kb}
							<div class="vpb-inspector__kbd-row">
								<kbd class="vpb-inspector__kbd">{kb.key}</kbd>
								<span class="vpb-inspector__kbd-action">{kb.description}</span>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.vpb-inspector {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.vpb-inspector__empty {
		font-size: 12px;
		color: var(--vpb-label-dim);
		text-align: center;
		padding: 16px 8px;
	}
	.vpb-inspector__hint {
		display: block;
		margin-top: 4px;
		font-size: 10px;
		color: var(--vpb-label-dim);
	}
	.vpb-inspector__section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.vpb-inspector__heading {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--vpb-label-color);
		margin: 0;
		padding-bottom: 2px;
		border-bottom: 1px solid var(--vpb-btn-bg);
	}
	.vpb-inspector__row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 2px 0;
	}
	.vpb-inspector__label {
		font-size: 11px;
		color: var(--vpb-label-color);
	}
	.vpb-inspector__value {
		font-size: 11px;
		font-family: monospace;
		color: var(--vpb-encoding-teal);
		background: var(--vpb-btn-bg);
		padding: 1px 4px;
		border-radius: 3px;
	}
	.vpb-inspector__desc {
		font-size: 11px;
		color: var(--vpb-value-color);
		margin: 0;
		line-height: 1.4;
	}
	.vpb-inspector__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.vpb-inspector__tag {
		font-size: 10px;
		font-family: monospace;
		padding: 1px 5px;
		border-radius: 3px;
	}
	.vpb-inspector__tag--required {
		background: var(--vpb-btn-active-bg);
		color: var(--vpb-tick-active);
	}
	.vpb-inspector__tag--optional {
		background: var(--vpb-border);
		color: var(--vpb-label-color);
	}
	.vpb-inspector__tag--state {
		background: var(--vpb-tag-purple-bg);
		color: var(--vpb-tag-purple-color);
	}
	.vpb-inspector__tag--state-specific {
		background: var(--vpb-tag-gold-bg);
		color: var(--vpb-tag-gold-color);
	}
	.vpb-inspector__kbd {
		font-size: 10px;
		font-family: monospace;
		background: var(--vpb-btn-hover);
		border: 1px solid var(--vpb-btn-border);
		padding: 1px 5px;
		border-radius: 3px;
		color: var(--vpb-value-color);
	}
	.vpb-inspector__attr {
		font-size: 10px;
		font-family: monospace;
		color: var(--vpb-tag-ember-color);
		background: var(--vpb-tag-ember-bg);
		padding: 1px 4px;
		border-radius: 3px;
	}
	.vpb-inspector__kbd-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.vpb-inspector__kbd-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.vpb-inspector__kbd-action {
		font-size: 10px;
		color: var(--vpb-label-color);
	}
</style>

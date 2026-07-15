<!--
	@file ManualEntry.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/ui/manual-entry

	The manual address well — always reachable, never the front door.
	ONE chrome: a wizard-inset carved-in well; the input inside is a
	bare token-styled <input> (well-in-well stark neumorphism, no
	nested card). The input buffer lives HERE (view-model, not app
	state); Connect hands the url up. Error/failed lines render REAL
	states only (command error text; probe-loop settled disconnect).
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import type { ManualEntryProps } from "../util/wizard.types.js";

let {
	label,
	placeholder,
	inputAria,
	inputTooltip,
	connectLabel,
	connectAria,
	working,
	disabled,
	errorText,
	showFailed,
	failedHint,
	onConnect,
}: ManualEntryProps = $props();

let urlInput = $state("");
</script>

<Card preset="wizard-inset" class="manual-panel">
	<div class="manual-head">
		<Heading level={3} size="sm">{label}</Heading>
	</div>
	<div class="manual-row">
		<Tooltip>
			<TooltipTrigger class="manual-input-trigger">
				<input
					class="manual-input"
					type="text"
					{placeholder}
					aria-label={inputAria}
					bind:value={urlInput}
					disabled={working || disabled}
					autocomplete="off"
					spellcheck="false"
				/>
			</TooltipTrigger>
			<TooltipContent preset="stark">{inputTooltip}</TooltipContent>
		</Tooltip>
		<Button
			preset="primary"
			size="md"
			aria-label={connectAria}
			onclick={() => onConnect(urlInput)}
			disabled={working || disabled || urlInput.trim().length === 0}
		>
			{#if working}<Spinner size="xs" tone="accent" />{/if}
			{connectLabel}
		</Button>
	</div>
	{#if errorText}
		<Text size="xs" class="manual-error">{errorText}</Text>
	{/if}
	{#if showFailed}
		<Text size="xs" color="muted">{failedHint}</Text>
	{/if}
</Card>

<style>
	/* Layout + token bindings only — chrome is the wizard-inset chain. */
	:global(.manual-panel) {
		flex-direction: column;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		padding: clamp(0.875rem, 1.6cqi, 1.125rem);
	}

	.manual-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.manual-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.manual-input-trigger) {
		flex: 1;
		min-width: 0;
		display: flex;
	}

	.manual-input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		background: var(--surface-inset);
		border: var(--border-width-hairline) solid var(--border-subtle);
		border-radius: 0.375rem;
		transition: border-color var(--duration-fast) ease;
	}
	.manual-input:focus {
		outline: none;
		border-color: var(--cta-main);
	}

	:global(.manual-error) {
		color: var(--accent-danger-main);
	}
</style>

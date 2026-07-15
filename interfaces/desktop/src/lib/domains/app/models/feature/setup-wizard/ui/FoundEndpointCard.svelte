<!--
	@file FoundEndpointCard.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/ui/found-endpoint-card

	One verified endpoint's capability card — everything shown is
	COMPUTED from the live handshake (kind / version / slots), never
	assumed. ONE chrome (wizard-elevated). Mounts exactly when a real
	`found` signal materialized the endpoint, entering via the
	UNIVERSAL `slide-up` animation (keyframes SSOT + `slide-up` token:
	300ms, one-shot forwards). Zero @keyframes in this file.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import type { FoundEndpointCardProps } from "../util/wizard.types.js";

let { endpoint, working, confirmLabel, confirmTooltip, onConfirm }: FoundEndpointCardProps =
	$props();
</script>

<Card preset="wizard-elevated" class="found-card animate-[slide-up_300ms_cubic-bezier(0,0,0.2,1)_forwards]">
	<div class="found-meta">
		<!-- Wire truth only: kind/version/slot-count from the handshake. -->
		<Heading level={4} size="sm">{endpoint.capability.kind}</Heading>
		<Text size="xs" color="muted">{endpoint.url}</Text>
		<div class="found-badges">
			<Badge variant="neutral" size="sm">{endpoint.capability.version}</Badge>
			<Badge variant="neutral" size="sm">{endpoint.capability.slots.length}</Badge>
		</div>
	</div>
	<Tooltip>
		<TooltipTrigger>
			<Button
				preset="primary"
				size="sm"
				onclick={() => onConfirm(endpoint.url)}
				disabled={working}
			>
				{confirmLabel}
			</Button>
		</TooltipTrigger>
		<TooltipContent preset="stark">{confirmTooltip}</TooltipContent>
	</Tooltip>
</Card>

<style>
	/* Layout only — chrome is the wizard-elevated preset chain. */
	:global(.found-card) {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		padding: clamp(0.75rem, 1.4cqi, 1rem);
	}

	@media (prefers-reduced-motion: reduce) {
		/* a11y guard at the binding site of the universal entrance. */
		:global(.found-card) {
			animation: none;
		}
	}

	.found-meta {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}

	.found-badges {
		display: flex;
		gap: 0.375rem;
	}
</style>

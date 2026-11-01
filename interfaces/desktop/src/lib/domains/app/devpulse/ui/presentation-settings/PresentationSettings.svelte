<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { hstack, stack } from "@devpulse/coldlight/utils";
import { presentationState } from "../../data-access/presentation.state.svelte.js";
</script>

<div class={stack({ gap: "3" })}>
	<Text as="p" size="sm" color="muted">Choose simple labels or advanced names and technical panels. You can switch at any time.</Text>
	<div class={hstack({ gap: "2" })} role="group" aria-label="Display detail">
		<Button variant={presentationState.advanced ? "secondary" : "primary"} aria-pressed={!presentationState.advanced} onclick={() => presentationState.setMode("simple")}>Simple</Button>
		<Button variant={presentationState.advanced ? "primary" : "secondary"} aria-pressed={presentationState.advanced} onclick={() => presentationState.setMode("advanced")}>Advanced</Button>
	</div>
	{#if presentationState.advanced}<Text size="sm" color="muted">Open the visual builder with Ctrl+Shift+B.</Text>{/if}
	{#if presentationState.error}<InlineMessage tone="warning">{presentationState.error}</InlineMessage>{/if}
</div>

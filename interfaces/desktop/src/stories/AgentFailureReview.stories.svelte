<script module>
import { defineMeta } from "@storybook/addon-svelte-csf";
import { FailedTurn } from "#lib/domains/chat/ui/index.js";

const { Story } = defineMeta({
	title: "AgentHub/Failure recovery",
	component: FailedTurn,
	args: {
		title: "Retained answer",
		note: "Review fixture. This copy stays here until dismissed. Copy anything you need before closing this window.",
		message:
			"The answer was not saved to history. Example recovery copy: agenthub/recovery/example.json. No tool work was retried.",
		text: "The project review completed.\n\n1. The answer remains selectable.\n2. Its line breaks are preserved.\n3. Dismissal removes only this visible copy.",
		dismissLabel: "Dismiss copy",
	},
});
</script>

<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
let dismissed = $state(false);
</script>

<Story name="Retained answer">
	{#snippet template(args)}
		<div class="mx-auto flex max-w-3xl flex-col gap-4 p-6">
			{#if dismissed}
				<Button onclick={() => { dismissed = false; }}>Reset review fixture</Button>
			{:else}
				<FailedTurn {...args} onDismiss={() => { dismissed = true; }} />
			{/if}
		</div>
	{/snippet}
</Story>

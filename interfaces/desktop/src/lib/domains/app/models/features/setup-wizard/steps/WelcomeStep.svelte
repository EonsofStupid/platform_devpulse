<!--
  @file WelcomeStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/WelcomeStep

  Entry screen for dev onboarding. Clyffy greeting + "Let's Go" CTA.
  Purely presentational — no side effects, no $effect.
-->
<script lang="ts">
import { Sparkles } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { pickVariation } from "../seed-families.js";

interface Props {
	onContinue: () => void;
}

let { onContinue }: Props = $props();

const greeting = pickVariation("welcome.greeting");
</script>

<div
	class={`${stack({ gap: "8", align: "center" })} flex-1 justify-center min-h-[60vh]`}
>
	<!-- Clyffy avatar placeholder -->
	<div
		class="flex items-center justify-center w-20 h-20 rounded-full border-2"
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<Text size="lg" weight="bold" color="primary">C</Text>
	</div>

	<!-- Greeting -->
	<div class={stack({ gap: "3", align: "center" })}>
		<Text size="lg" weight="bold" color="primary">
			{greeting || "Hey! I'm Clyffy. Let's get you set up."}
		</Text>
		<Text size="sm" color="muted">
			Let me take a look at what we're working with...
		</Text>
	</div>

	<!-- CTA -->
	<button
		class="flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold transition-all hover:brightness-125"
		style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: var(--glow-teal);"
		onclick={onContinue}
		aria-label="Start hardware scan"
	>
		<Sparkles size={18} />
		Let's Go
	</button>
</div>

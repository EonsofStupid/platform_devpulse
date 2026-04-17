<!--
  @file VoiceLabPanel.svelte
  @domain models/setup-wizard

  Thin setup-wizard adapter over the real Voice Lab domain panel.
  The setup overlay should compose the same TTS/STT/profile/test UI
  used by the dedicated Voice Lab window instead of maintaining a
  parallel copy of voice controls.

  **Parent contract**
    interface Props {
      open: boolean;
      onClose: () => void;
    }
-->
<script lang="ts">
import { ArrowLeft, Headphones } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import DomainVoiceLabPanel from "$lib/domains/app/voice/feature/lab/VoiceLabPanel.svelte";

interface Props {
	open: boolean;
	onClose: () => void;
}

let { open, onClose }: Props = $props();
</script>

{#if open}
	<div class="voice-lab-bridge">
		<header class="voice-lab-bridge-header">
			<Button preset="ghost" size="md" onclick={onClose} aria-label="Back">
				<ArrowLeft size={16} aria-hidden="true" />
				Back
			</Button>
			<div class="voice-lab-bridge-copy">
				<Heading level={3} size="md">
					<Headphones size={20} aria-hidden="true" />
					Voice Lab
				</Heading>
				<Text size="xs" color="muted">
					This panel reuses the live voice domain tools for TTS, STT, profiles, and end-to-end smoke tests.
				</Text>
			</div>
		</header>

		<div class="voice-lab-bridge-body">
			<DomainVoiceLabPanel />
		</div>
	</div>
{/if}

<style>
	.voice-lab-bridge {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		animation: slide-in 200ms ease-out;
	}
	@keyframes slide-in {
		from { opacity: 0; transform: translateX(1rem); }
		to { opacity: 1; transform: translateX(0); }
	}

	.voice-lab-bridge-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.voice-lab-bridge-copy {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.voice-lab-bridge-body {
		width: 100%;
	}
</style>

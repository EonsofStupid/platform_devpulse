<!--
  @file Voice Lab
  @route /voice-lab
  @domain voice

  TTS/STT configuration page, inside the app frame: the `(voice-lab)` group
  was a separate Tauri child window, and that window role no longer exists.
  Configure voices, test microphone, manage voice profiles.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { VoiceLabPanel } from "#lib/domains/app/voice/index.js";
import { routeCopy, routeHere } from "#lib/sys/routing/index.js";

const here = $derived(routeHere());
const heading = $derived(here ? routeCopy(here) : undefined);
</script>

<div class="flex flex-col h-full" data-page="voice-lab">
	<header class="flex flex-col gap-1 p-4">
		<Heading level={1} size="lg">{heading?.label}</Heading>
		<Text size="sm" color="muted">{heading?.description}</Text>
	</header>

	<div class="flex-1 min-h-0 overflow-y-auto">
		<VoiceLabPanel />
	</div>
</div>

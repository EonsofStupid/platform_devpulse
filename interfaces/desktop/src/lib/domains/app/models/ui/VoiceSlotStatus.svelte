<!--
  @file VoiceSlotStatus — Inline mic/speaker status indicators.
  Shows whether STT and TTS models are loaded and ready.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Mic, Volume2 } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";

interface Props {
	sttActive: boolean;
	ttsActive: boolean;
	micDetected: boolean;
}

let { sttActive, ttsActive, micDetected }: Props = $props();
</script>

<div class={hstack({ gap: "3", align: "center" })} title="Shows whether voice input (microphone) and voice output (speaker) models are ready">
	<div class={hstack({ gap: "1", align: "center" })}>
		<Mic size={12} style="color: {sttActive ? 'var(--signal-success)' : 'var(--text-muted)'};" />
		<Text size="xs" color={sttActive ? "positive" : "muted"}>
			{sttActive ? "Listening" : micDetected ? "Mic ready" : "No mic"}
		</Text>
	</div>
	<div class={hstack({ gap: "1", align: "center" })}>
		<Volume2 size={12} style="color: {ttsActive ? 'var(--signal-success)' : 'var(--text-muted)'};" />
		<Text size="xs" color={ttsActive ? "positive" : "muted"}>
			{ttsActive ? "Speaking" : "Silent"}
		</Text>
	</div>
</div>

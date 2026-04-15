<!--
	@file /devtools/stt — Speech-to-Text devtool
	@route /devtools/stt
	@window DevTools (Ctrl+Shift+Z)

	Transcription configuration surface. Model selection (Whisper /
	Sherpa), streaming vs batch, mic device, VAD thresholds.

	SCAFFOLD — filled in progressively.
-->
<script lang="ts">
import { Activity, Ear, Mic, Settings } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Ear size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">Speech-to-Text</Text>
			</div>
			<Text size="xs" color="muted">
				Audio input and transcription configuration. Whisper / Sherpa backends.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Mic size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Input device</Text>
					<Text size="xs" color="muted">
						Microphone enumeration, sample rate, gain, and VU meter.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Settings size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Backend selection</Text>
					<Text size="xs" color="muted">
						Whisper (file-based, accurate) or Sherpa-onnx (streaming, always-on STS).
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Activity size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">VAD + endpointing</Text>
					<Text size="xs" color="muted">
						Voice activity detection thresholds. When to decide the user stopped speaking.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>

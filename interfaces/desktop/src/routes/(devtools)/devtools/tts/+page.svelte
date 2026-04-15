<!--
	@file /devtools/tts — Text-to-Speech devtool
	@route /devtools/tts
	@window DevTools (Ctrl+Shift+Z)

	Voice configuration surface. Model selection (Kokoro / Piper /
	Orpheus), voice picker, speed + pitch, voice cloning, sample
	playback.

	SCAFFOLD — filled in progressively.
-->
<script lang="ts">
import { Play, Sparkles, UserPlus, Volume2 } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Volume2 size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">Text-to-Speech</Text>
			</div>
			<Text size="xs" color="muted">
				Voice synthesis configuration. Kokoro / Piper / Orpheus backends.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Sparkles size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Backend selection</Text>
					<Text size="xs" color="muted">
						Kokoro (default, 24kHz), Piper (lightweight, on-device), Orpheus (expressive, experimental).
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Play size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Voice picker + preview</Text>
					<Text size="xs" color="muted">
						Browse available voices. Click any to preview a sample.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<UserPlus size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Voice cloning</Text>
					<Text size="xs" color="muted">
						Upload a 30-second voice sample to generate a custom voice profile.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>

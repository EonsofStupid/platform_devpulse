<!--
	@file /devtools/sts — Speech-to-Speech devtool
	@route /devtools/sts
	@window DevTools (Ctrl+Shift+Z)

	Authoring surface for the always-on STS pipeline. Configures the
	wake-word detector, streaming STT, the routing policy (quick vs
	deep vs council), and the voice synthesis tail.

	Layman view surfaces the same controls one level up via Clyffy's
	settings panel — this is the full builder view with raw thresholds,
	latency budgets, and diagnostic traces.

	SCAFFOLD — filled in progressively. See `.claude/sprint-sts.md`
	when that lands for the full spec.
-->
<script lang="ts">
import { Ear, MessageCircle, Mic, Radio, Volume2 } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Radio size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">Speech-to-Speech</Text>
			</div>
			<Text size="xs" color="muted">
				Always-on voice pipeline. Wake word → transcription → reasoning → voice response.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Ear size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Wake word</Text>
					<Text size="xs" color="muted">
						Always-loaded keyword spotter. Sherpa-onnx kws model. Sensitivity + phrase selection go here.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Mic size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Streaming STT</Text>
					<Text size="xs" color="muted">
						Triggered on wake. Sherpa-onnx or Whisper. Chunk size + endpoint detection go here.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<MessageCircle size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Router + council</Text>
					<Text size="xs" color="muted">
						Classifies each utterance as quick (minion), deep (brain), or council (multi-model deliberation).
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Volume2 size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Voice response</Text>
					<Text size="xs" color="muted">
						TTS tail. Kokoro by default. Voice selection + speed go here.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>

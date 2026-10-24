<!--
  @feature VoiceOrb — mic states (STT wiring deferred)
-->
<script lang="ts">
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { cn } from "@devpulse/coldlight/utils";
import { Mic } from "lucide-svelte";

type VoiceState = "idle" | "ready" | "listening" | "alert";

interface Props {
	state?: VoiceState;
	class?: string;
}

let { state = "idle", class: className }: Props = $props();

const preset = $derived(
	state === "listening" || state === "alert" ? "chat-voice-orb-listening" : "chat-voice-orb-idle",
);
const m = $derived(renderForge({ kind: "button", preset, state: "default" }));

function toggle() {
	// Stub — future STT pipeline
	window.dispatchEvent(new CustomEvent("chat:voice-toggle"));
}
</script>

<button
	type="button"
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("flex size-11 items-center justify-center rounded-full", className)}
	onclick={toggle}
	aria-label="Voice"
>
	<Mic size={18} />
</button>

<!--
  @component StatusDotNeuron — cortex graph node
-->
<script lang="ts">
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { cn } from "@devpulse/coldlight/utils";
import { Brain, Database, FileText, Image, StickyNote } from "lucide-svelte";

export type CortexCategory = "vector" | "relational" | "flat-file" | "brain" | "images" | "notes";

interface Props {
	category: CortexCategory;
	active: boolean;
	class?: string;
}

let { category, active, class: className }: Props = $props();

const Icon = $derived(
	category === "vector"
		? Database
		: category === "relational"
			? Database
			: category === "flat-file"
				? FileText
				: category === "brain"
					? Brain
					: category === "images"
						? Image
						: StickyNote,
);

const m = $derived(
	renderForge({
		kind: "button",
		preset: "chat-cortex-node",
		state: active ? "active" : "default",
	}),
);
const pulse = $derived(active ? "animate-[cl-glow-pulse_3s_ease-in-out_infinite]" : "");
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("flex size-9 items-center justify-center rounded-full", pulse, className)}
	aria-label={category}
>
	<Icon size={14} />
</div>

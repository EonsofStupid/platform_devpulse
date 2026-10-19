<!--
  @feature CortexMemoryStrip — read-only cortex context graph
-->
<script lang="ts">
import { Text } from "@devpulse/coldlight/components/text";
import { modelsState } from "$lib/domains/app/models/index.js";
import { StatusDotNeuron } from "../ui/index.js";

const brain = $derived(modelsState.statuses["chat.brain"]);
const brainActive = $derived(brain?.type === "ready" || brain?.type === "loading");
</script>

<div class="flex flex-col gap-2 border-b border-[var(--border-subtle)] pb-2">
	<Text size="xs" weight="semibold" class="tracking-wide text-[var(--text-muted)]">CORTEX MEMORY</Text>
	<div class="flex items-center gap-2 overflow-x-auto">
		<StatusDotNeuron category="vector" active={false} />
		<StatusDotNeuron category="relational" active={false} />
		<StatusDotNeuron category="flat-file" active={false} />
		<StatusDotNeuron category="brain" active={brainActive} />
		<StatusDotNeuron category="images" active={false} />
		<StatusDotNeuron category="notes" active={false} />
	</div>
</div>

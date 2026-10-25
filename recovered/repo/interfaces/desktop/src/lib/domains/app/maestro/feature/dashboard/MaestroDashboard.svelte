<!--
  @file MaestroDashboard — Maestro domain dashboard (placeholder).
  Rendered by (app)/maestro/+page.svelte.
  TODO: wire to real maestro state/services as the domain gets built out.
-->
<script lang="ts">
import { Layers } from "lucide-svelte";
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Text } from "$lib/design/components/text/index.js";
</script>

<div class="grid grid-cols-12 gap-4" data-page="maestro-dashboard">
	<div class="col-span-12">
		<Widget
			title="Maestro"
			icon={Layers}
			surface="glass-deep"
			depth="z2"
			bevel="soft"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<Text as="p" size="sm" color="muted">
				Maestro domain dashboard placeholder. Wire real state + services as the domain
				grows.
			</Text>
		</Widget>
	</div>
</div>

<!--
	@file Clyffy Dashboard
	@route /clyffy
	@domain clyffy

	Layman-safe landing page for Clyffy. Renders the large presence
	orb, activity text, and the layman capability browser. DEV-only
	introspection (ClyffyPresence dev mode, debug panels) lives under
	the `__DEV__` gate — those components land in a later turn.
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { ClyffyStatusOrb, clyffyStatus, ToolsBrowser } from "$lib/domains/clyffy/index.js";

const activity = $derived(clyffyStatus.activity);
</script>

<div class="grid grid-cols-12 gap-4" data-page="clyffy-dashboard">
	<div class="col-span-12 lg:col-span-5">
		<Widget
			title="Clyffy"
			surface="glass-deep"
			depth="z2"
			bevel="subtle"
			glow="teal"
			frame="accent-teal"
			radius="lg"
		>
			<div class={`${stack({ gap: "4" })} items-center text-center`}>
				<ClyffyStatusOrb size="lg" label />
				{#if activity.text.length > 0}
					<Text size="sm" color="muted">{activity.text}</Text>
				{/if}
			</div>
		</Widget>
	</div>

	<div class="col-span-12 lg:col-span-7">
		<Widget
			title="What I can do"
			surface="glass-deep"
			depth="z1"
			bevel="subtle"
			frame="soft"
			radius="lg"
		>
			<ToolsBrowser />
		</Widget>
	</div>
</div>

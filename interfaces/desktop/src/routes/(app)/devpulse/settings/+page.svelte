<!--
  @file DevPulse Settings
  @route /devpulse/settings
  @domain devpulse
-->
<script lang="ts">
import { Widget } from "$lib/design/blocks/widgets/index.js";
import { container } from "$lib/design/utils/container/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
</script>

<div class={cn(container({}), "container-md")} data-page="devpulse-settings">
	<div class={stack({ gap: "4" })}>
		<Widget title="Profile">
			<div class={stack({ gap: "3" })}>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Display Name</Text>
					<Text>Developer</Text>
				</div>
				<div class={hstack({ justify: "between" })}>
					<Text color="secondary">Theme</Text>
					<Text>ColdLight Dark</Text>
				</div>
			</div>
		</Widget>

		<Widget title="Integrations">
			<Text as="p" size="sm" color="muted">GitHub, GitLab, and Bitbucket integrations will be configured here.</Text>
		</Widget>
	</div>
</div>

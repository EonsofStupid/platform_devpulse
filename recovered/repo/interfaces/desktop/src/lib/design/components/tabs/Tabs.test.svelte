<script lang="ts">
import * as Tabs from "./index.js";

import "$lib/design/recipes/components/tabs/index.js";
import "$lib/design/blueprints/components/tabs/index.js";

interface Props {
	value?: string;
	orientation?: "horizontal" | "vertical";
	activateOnFocus?: boolean;
	loop?: boolean;
}

let {
	value = $bindable("settings"),
	orientation = "horizontal",
	activateOnFocus = true,
	loop = true,
}: Props = $props();
</script>

<Tabs.Root bind:value {orientation} {activateOnFocus} {loop}>
	<Tabs.List>
		<Tabs.Trigger value="settings">Settings</Tabs.Trigger>
		<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
		<Tabs.Trigger value="notifications" disabled>Notifications</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="settings">Settings panel content</Tabs.Content>
	<Tabs.Content value="profile">Profile panel content</Tabs.Content>
	<Tabs.Content value="notifications">Notifications panel content</Tabs.Content>
</Tabs.Root>

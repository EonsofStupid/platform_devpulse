<!-- @file Restored tree behavior fixture: hierarchy, selection and disabled nodes. -->
<script lang="ts">
import Tree from "./Tree.svelte";
import TreeItem from "./TreeItem.svelte";
import type { TreeProps } from "./types.js";

let props: Omit<TreeProps, "children"> = $props();
</script>

<Tree aria-label="Workspace" {...props}>
	<TreeItem value="source" label="Source">
		<TreeItem value="app" label="App.ts" />
		<TreeItem value="nested" label="Nested">
			<TreeItem value="kernel" label="Kernel.rs" />
		</TreeItem>
		<TreeItem value="unavailable" label="Unavailable" disabled />
	</TreeItem>
	<TreeItem value="readme" label="README.md" />
	<TreeItem value="tests" label="Tests">
		<TreeItem value="runtime" label="Runtime.rs" />
	</TreeItem>
</Tree>

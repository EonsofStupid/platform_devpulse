<!-- @file Restored Tree review surface: generated families, hierarchy and selection. -->
<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";

const { Story } = defineMeta({ title: "ColdLight/Tree", tags: ["autodocs"] });
</script>

<script lang="ts">
import { Card } from "@devpulse/coldlight/components/card";
import { Tree, TreeItem } from "@devpulse/coldlight/components/tree";
</script>

<Story name="Workspace hierarchy">
	<Card surface="glass" variant="elevated" class="m-8 p-6 max-w-lg">
		<Tree aria-label="Workspace" selectionMode="single" defaultExpandedKeys={new Set(["kernel"])}>
			<TreeItem value="kernel" label="Kernel">
				<TreeItem value="providers" label="AI endpoints" />
				<TreeItem value="memory" label="Persona memory" />
			</TreeItem>
			<TreeItem value="engine" label="Engine">
				<TreeItem value="services" label="Platform services" />
			</TreeItem>
			<TreeItem value="plans" label="Plans" />
		</Tree>
	</Card>
</Story>

<Story name="Multiple selection">
	<Card surface="neuro" variant="solid" class="m-8 p-6 max-w-lg">
		<Tree aria-label="Sources to review" selectionMode="multiple">
			<TreeItem value="code" label="Code" />
			<TreeItem value="docs" label="Documentation" />
			<TreeItem value="tests" label="Tests" />
			<TreeItem value="unavailable" label="Unavailable source" disabled />
		</Tree>
	</Card>
</Story>

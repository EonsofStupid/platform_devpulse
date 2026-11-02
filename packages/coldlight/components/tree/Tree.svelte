<!--
	@component Tree
	@kind tree
	@layer component
	@category composite
	@description Hierarchical list with expandable nodes for browsing nested data structures
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
	@container true
	@containerSlots root
	@compound true
	@blockCategory data
	@slots root:all, item:none, group:none, indicator:none
-->
<script lang="ts">
import { useTree } from "#coldlight/behaviors/navigation/tree/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { setTreeContext } from "./context.js";
import { TREE_DEFAULTS } from "./tree.generated.js";
import type { TreeProps } from "./types.js";

let {
	id,
	expandedKeys,
	defaultExpandedKeys,
	onExpandedChange,
	selectedKeys,
	defaultSelectedKeys,
	onSelectionChange,
	selectionMode = "none",
	onAction,
	disabled = false,
	variant = TREE_DEFAULTS.variant,
	surface,
	children,
	class: className,
	"aria-label": label,
	"aria-labelledby": labelledBy,
	...rest
}: TreeProps = $props();

const behavior = useTree({
	get id() {
		return id ?? undefined;
	},
	get expandedKeys() {
		return expandedKeys;
	},
	get defaultExpandedKeys() {
		return defaultExpandedKeys;
	},
	get selectedKeys() {
		return selectedKeys;
	},
	get defaultSelectedKeys() {
		return defaultSelectedKeys;
	},
	get selectionMode() {
		return selectionMode;
	},
	get disabled() {
		return disabled;
	},
	get "aria-label"() {
		return label ?? undefined;
	},
	get "aria-labelledby"() {
		return labelledBy ?? undefined;
	},
	onExpandedChange: (keys) => onExpandedChange?.(keys),
	onSelectionChange: (keys) => onSelectionChange?.(keys),
	onAction: (key) => onAction?.(key),
});
setTreeContext({
	behavior,
	get variant() {
		return variant;
	},
});
const attrs = $derived(mergeProps(rest, behavior.root));
</script>

<div {...attrs} {...styleAttrs({ kind: "tree", surface })} class={cn(className)}>
	{@render children?.()}
</div>

<!--
	@component NavItem
	@kind nav-item
	@layer components

	ColdLight NavItem: one link in a navigation list. The behavior owns its ARIA;
	its look is nav-item.tokens.json's generated CSS.
-->
<script lang="ts">
import { useNavItem } from "#coldlight/behaviors/navigation/nav-item/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { NAV_ITEM_DEFAULTS } from "./nav-item.generated.js";
import type { NavItemComponentProps } from "./types.js";

let {
	active = false,
	disabled = false,
	href,
	size = NAV_ITEM_DEFAULTS.size,
	children,
	class: className,
	...rest
}: NavItemComponentProps = $props();

const item = useNavItem({
	get active() {
		return active;
	},
	get disabled() {
		return disabled;
	},
	get href() {
		return href ?? undefined;
	},
});
</script>

<a
	{...rest}
	{...item.root}
	{...styleAttrs({ kind: "nav-item", size })}
	class={cn("inline-flex items-center", className)}
>
	{@render children?.()}
</a>

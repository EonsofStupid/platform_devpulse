<!--
	@component Breadcrumbs
	@kind breadcrumbs
	@layer components

	ColdLight Breadcrumbs: the navigation landmark, with the behavior's ARIA and the
	separator its items share. Its look is breadcrumbs.tokens.json's generated CSS.

	Reference: WAI-ARIA APG Breadcrumb Pattern
-->
<script lang="ts">
import { useBreadcrumbs } from "#coldlight/behaviors/navigation/breadcrumbs/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { BREADCRUMBS_DEFAULTS } from "./breadcrumbs.generated.js";
import { setBreadcrumbsContext } from "./context.js";
import type { BreadcrumbsProps } from "./types.js";

let {
	label,
	separator = "/",
	size = BREADCRUMBS_DEFAULTS.size,
	children,
	class: className,
	...rest
}: BreadcrumbsProps = $props();

const hook = useBreadcrumbs({
	get label() {
		return label;
	},
});

setBreadcrumbsContext({
	get hook() {
		return hook;
	},
	get separator() {
		return separator;
	},
});
</script>

<nav {...hook.root} {...styleAttrs({ kind: "breadcrumbs", size })} data-slot="root" class={cn(className)} {...rest}>
	{@render children?.()}
</nav>

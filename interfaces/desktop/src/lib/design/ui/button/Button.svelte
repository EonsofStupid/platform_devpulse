<!--
	@component Button (UI)
	@kind button

	What users import. StyleMacro + dumb component.
	Intent maps to DTCG style token group.
	Props drive everything. Users never think about StyleMacro.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import ButtonRoot from "$lib/design/components/button/Button.svelte";
import type { Snippet } from "svelte";
import type { ButtonSize } from "$lib/design/components/button/button.types.js";
import type { ButtonType } from "$lib/design/primitives/button/button.types.js";

export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

interface Props {
	intent?: ButtonIntent;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	pressed?: boolean;
	onPressedChange?: (pressed: boolean) => void;
	expanded?: boolean;
	type?: ButtonType;
	children?: Snippet;
	class?: string;
	[key: string]: unknown;
}

let {
	intent = "primary",
	size = "md",
	disabled = false,
	loading = false,
	pressed,
	onPressedChange,
	expanded,
	type,
	children,
	class: className,
	...rest
}: Props = $props();

const styleId = $derived(`button-${intent}`);
</script>

<StyleMacro kind="button" style={styleId}>
	<ButtonRoot
		{size}
		{disabled}
		{loading}
		{pressed}
		{onPressedChange}
		{expanded}
		{type}
		class={className}
		{...rest}
	>
		{@render children?.()}
	</ButtonRoot>
</StyleMacro>

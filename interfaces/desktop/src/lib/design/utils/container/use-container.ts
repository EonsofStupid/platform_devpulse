/**
 * container — Token-backed responsive max-width container.
 *
 * Returns a Tailwind class string. No inline styles.
 * Maps size presets to --size-container-{size} custom properties.
 */

import { cn } from "$lib/design/utils/cn.js";
import type { ContainerSize, ContainerProps } from "./container.types.js";

function resolveMaxWidth(size: ContainerSize): string {
	if (size === "full") return "max-w-full";
	return `max-w-[var(--size-container-${size})]`;
}

export function container(props: ContainerProps = {}): string {
	const size = props.size ?? "lg";
	const centered = props.centered ?? true;

	return cn(
		"w-full",
		resolveMaxWidth(size),
		centered && "mx-auto",
		props.padding !== undefined && `px-[var(--space-${props.padding})]`,
	);
}

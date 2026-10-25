/**
 * @file createButton — ColdLight ARIA Hook
 * @kind button
 * @layer hooks
 *
 * Provides ARIA attributes, keyboard handling, and state management
 * for the Button component. Derived from the button contract.
 *
 * Reference: W3C WAI-ARIA APG Button Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/button/
 */

export interface CreateButtonOptions {
	disabled?: () => boolean;
	pressed?: () => boolean | undefined;
	loading?: () => boolean;
	expanded?: () => boolean | undefined;
	type?: () => "button" | "submit" | "reset" | undefined;
	onPressedChange?: (pressed: boolean) => void;
}

export interface ButtonHookReturn {
	root: {
		role: "button";
		type: "button" | "submit" | "reset";
		disabled: boolean;
		"aria-disabled": "true" | undefined;
		"aria-pressed": "true" | "false" | undefined;
		"aria-busy": "true" | undefined;
		"aria-expanded": "true" | "false" | undefined;
		"data-state": string;
		onkeydown: (e: KeyboardEvent) => void;
		onclick: (e: MouseEvent) => void;
	};
}

/**
 * Create ARIA-compliant button attributes and handlers.
 *
 * Usage:
 * ```svelte
 * const builder = createButton({ disabled: () => false });
 * <button {...builder.root}>Click me</button>
 * ```
 */
export function createButton(options: CreateButtonOptions): ButtonHookReturn {
	const isDisabled = () => options.disabled?.() ?? false;
	const isPressed = () => options.pressed?.();
	const isLoading = () => options.loading?.() ?? false;
	const isExpanded = () => options.expanded?.();
	const buttonType = (): "button" | "submit" | "reset" => options.type?.() ?? "button";

	function getState(): string {
		if (isLoading()) return "loading";
		if (isDisabled()) return "disabled";
		if (isPressed()) return "pressed";
		return "idle";
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isDisabled() || isLoading()) return;
		if (e.key === "Enter" || e.key === " ") {
			if (e.key === " ") e.preventDefault();
			if (isPressed() !== undefined && options.onPressedChange) {
				options.onPressedChange(!isPressed());
			}
		}
	}

	function handleClick(e: MouseEvent) {
		if (isDisabled() || isLoading()) {
			e.preventDefault();
			return;
		}
		if (isPressed() !== undefined && options.onPressedChange) {
			options.onPressedChange(!isPressed());
		}
	}

	return {
		root: {
			role: "button",
			type: buttonType(),
			disabled: isDisabled(),
			"aria-disabled": isDisabled() ? "true" : undefined,
			"aria-pressed":
				isPressed() !== undefined
					? isPressed()
						? "true"
						: "false"
					: undefined,
			"aria-busy": isLoading() ? "true" : undefined,
			"aria-expanded":
				isExpanded() !== undefined
					? isExpanded()
						? "true"
						: "false"
					: undefined,
			"data-state": getState(),
			onkeydown: handleKeydown,
			onclick: handleClick,
		},
	};
}

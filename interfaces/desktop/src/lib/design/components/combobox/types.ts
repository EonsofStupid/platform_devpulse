import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "$lib/design/primitives/types.js";
import type { ComponentSurfaceProps } from "../types.js";

export interface ComboboxProps<T> extends ComponentSurfaceProps, BaseProps {
	open?: boolean;
	value?: T;
	inputValue?: string;
	closeOnEscape?: boolean;
	closeOnOutsideClick?: boolean;
	sameWidth?: boolean;
	children?: Snippet;
}

export interface ComboboxInputProps extends OmitStyle<HTMLInputElement>, BaseProps {
	placeholder?: string;
}

export interface ComboboxTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

export interface ComboboxContentProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxLabelProps extends OmitStyle<HTMLLabelElement>, BaseProps {
	children?: Snippet;
}

export interface ComboboxItemProps<T> extends BaseProps {
	value: T;
	label?: string;
	children?: Snippet;
	class?: string;
}

export interface ComboboxEmptyProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

export interface ComboboxGroupProps extends BaseProps {
	children?: Snippet;
	class?: string;
}

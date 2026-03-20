import type { HTMLAttributes } from "svelte/elements";

export interface UseKeyboardProps {
	onKeyDown?: (e: KeyboardEvent) => void;
	onKeyUp?: (e: KeyboardEvent) => void;
}

export type KeyboardPropsAttrs = Pick<HTMLAttributes<HTMLElement>, "onkeydown" | "onkeyup">;

export interface UseKeyboardReturn {
	readonly keyboardProps: KeyboardPropsAttrs;
}

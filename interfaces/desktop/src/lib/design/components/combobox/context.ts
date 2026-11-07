import { getContext, setContext } from "svelte";
import type {
	ComboboxActions,
	ComboboxInstance,
} from "$lib/design/taxonomy/.generated/imports.gen.js";

const CTX_KEY = Symbol("coldlight:components:combobox");

export interface ComboboxComponentContext<T> {
	readonly transport: ComboboxInstance<T> & ComboboxActions<T>;
	readonly classes: Record<string, string>;
}

export function setComboboxComponentContext<T>(ctx: ComboboxComponentContext<T>): void {
	setContext(CTX_KEY, ctx);
}

export function getComboboxComponentContext<T>(): ComboboxComponentContext<T> {
	return getContext<ComboboxComponentContext<T>>(CTX_KEY);
}

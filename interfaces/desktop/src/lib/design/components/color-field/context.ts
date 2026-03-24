/**
 * @file ColorField Context
 * @kind color-field
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { ColorChannel, ColorSpace, ColorValue } from "$lib/design/components/color-area/types.js";
import type { ColorFieldSize } from "./types.js";

export interface ColorFieldContext {
	readonly value: ColorValue | null;
	readonly channel: ColorChannel | undefined;
	readonly colorSpace: ColorSpace | undefined;
	readonly size: ColorFieldSize;
	readonly isDisabled: boolean;
	readonly isReadOnly: boolean;
	readonly isRequired: boolean;
	readonly isInvalid: boolean;
	readonly validationError: string | null;
	readonly dir: "ltr" | "rtl";
	readonly placeholder: string;
	readonly name: string | undefined;
	readonly form: string | undefined;
	/** Auto-generated or user-provided IDs for all slots. */
	readonly ids: {
		readonly root: string;
		readonly input: string;
		readonly label: string;
		readonly description: string;
		readonly errorMessage: string;
	};
	/** Whether the description slot is rendered (for conditional aria-describedby). */
	readonly hasDescription: boolean;
	/** Whether the error slot is rendered (for conditional aria-errormessage). */
	readonly hasError: boolean;
	/** Update the color value from user input. */
	setValue(raw: string): void;
	/** Register that a description slot exists. */
	registerDescription(): void;
	/** Register that an error slot exists. */
	registerError(): void;
}

const COLOR_FIELD_CTX = Symbol("coldlight-color-field");

export function setColorFieldContext(ctx: ColorFieldContext): void {
	setContext(COLOR_FIELD_CTX, ctx);
}

export function getColorFieldContext(): ColorFieldContext {
	return getContext<ColorFieldContext>(COLOR_FIELD_CTX);
}

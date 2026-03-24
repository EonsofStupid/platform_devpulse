import { getContext, setContext } from "svelte";
import type { DateFieldGranularity, DateFieldIds, DateSegment } from "./types.js";

export interface DateFieldContext {
	readonly value: Date | null | undefined;
	readonly segments: DateSegment[];
	readonly granularity: DateFieldGranularity;
	readonly isDisabled: boolean;
	readonly isReadOnly: boolean;
	readonly isRequired: boolean;
	readonly isInvalid: boolean;
	readonly locale: string;
	readonly size: string;
	readonly dir: "ltr" | "rtl";
	readonly ids: { root: string; label: string; description: string; errorMessage: string };
	readonly focusedIndex: number;
	focusSegment(index: number): void;
	incrementSegment(index: number): void;
	decrementSegment(index: number): void;
	setSegmentValue(index: number, numericValue: number): void;
	focusNextSegment(): void;
	focusPrevSegment(): void;
}

const DATE_FIELD_CTX = Symbol("coldlight-date-field");

export function setDateFieldContext(ctx: DateFieldContext): void {
	setContext(DATE_FIELD_CTX, ctx);
}

export function getDateFieldContext(): DateFieldContext {
	return getContext<DateFieldContext>(DATE_FIELD_CTX);
}

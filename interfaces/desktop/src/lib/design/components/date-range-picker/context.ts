import { getContext, setContext } from "svelte";
import type { DateRangePickerIds, DateRangeValue } from "./types.js";

export interface DateRangePickerContext {
	readonly value: DateRangeValue | null | undefined;
	readonly isOpen: boolean;
	readonly isDisabled: boolean;
	readonly isReadOnly: boolean;
	readonly isRequired: boolean;
	readonly isInvalid: boolean;
	readonly inline: boolean;
	readonly locale: string;
	readonly size: string;
	readonly dir: "ltr" | "rtl";
	readonly classes: Record<string, string>;
	readonly ids: {
		readonly root: string;
		readonly startField: string;
		readonly endField: string;
		readonly trigger: string;
		readonly content: string;
		readonly label: string;
		readonly description: string;
		readonly errorMessage: string;
	};
	readonly shouldCloseOnSelect: boolean;
	toggle(): void;
	openPopover(): void;
	closePopover(): void;
	selectRange(range: DateRangeValue): void;
	updateStart(date: Date | null): void;
	updateEnd(date: Date | null): void;
}

const CTX = Symbol("coldlight-date-range-picker");

export function setDateRangePickerContext(ctx: DateRangePickerContext): void {
	setContext(CTX, ctx);
}

export function getDateRangePickerContext(): DateRangePickerContext {
	return getContext<DateRangePickerContext>(CTX);
}

import { getContext, setContext } from "svelte";

export interface DatePickerContext {
	readonly value: Date | null | undefined;
	readonly isOpen: boolean;
	readonly isDisabled: boolean;
	readonly isReadOnly: boolean;
	readonly isRequired: boolean;
	readonly isInvalid: boolean;
	readonly locale: string;
	readonly size: string;
	readonly dir: "ltr" | "rtl";
	readonly ids: {
		readonly root: string;
		readonly field: string;
		readonly trigger: string;
		readonly content: string;
		readonly label: string;
		readonly description: string;
		readonly errorMessage: string;
	};
	readonly minValue: Date | null | undefined;
	readonly maxValue: Date | null | undefined;
	readonly shouldCloseOnSelect: boolean;
	toggle(): void;
	openPopover(): void;
	closePopover(): void;
	selectDate(date: Date): void;
	updateValue(date: Date | null): void;
}

const DATE_PICKER_CTX = Symbol("coldlight-date-picker");

export function setDatePickerContext(ctx: DatePickerContext): void {
	setContext(DATE_PICKER_CTX, ctx);
}

export function getDatePickerContext(): DatePickerContext {
	return getContext<DatePickerContext>(DATE_PICKER_CTX);
}

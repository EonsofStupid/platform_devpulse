import type {
	HTMLAttributes,
	HTMLButtonAttributes,
	HTMLTableAttributes,
	HTMLThAttributes,
} from "svelte/elements";

export type CalendarWeekStart = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface CalendarValueChangeDetails {
	value: Date | undefined;
}

export interface CalendarFocusChangeDetails {
	date: Date;
}

export interface UseCalendarProps {
	/** Controlled selected date. */
	value?: Date | null;
	/** Initial value when uncontrolled. */
	defaultValue?: Date | null;
	/** Fired when the selected date changes. */
	onValueChange?: (details: CalendarValueChangeDetails) => void;
	/** Controlled focused date (roving tabindex target). */
	focusedValue?: Date | null;
	/** Initial focused date when uncontrolled. */
	defaultFocusedValue?: Date | null;
	/** Fired when the focused date changes. */
	onFocusChange?: (details: CalendarFocusChangeDetails) => void;
	/** Month displayed on mount. @default the focused date's month, or today */
	defaultMonth?: Date;
	/** Predicate to mark specific dates as unavailable. */
	isDateUnavailable?: (date: Date) => boolean;
	/** Inclusive lower bound. */
	minValue?: Date | null;
	/** Inclusive upper bound. */
	maxValue?: Date | null;
	/** Whether every cell is disabled. @default false */
	disabled?: boolean;
	/** Disallows selection changes. @default false */
	readOnly?: boolean;
	/** Marks the current selection as invalid. @default false */
	invalid?: boolean;
	/** Day that starts each week row. @default "sun" */
	firstDayOfWeek?: CalendarWeekStart;
	/** BCP-47 locale for month / weekday formatting. @default "en-US" */
	locale?: string;
	/** Text direction. @default "ltr" */
	dir?: "ltr" | "rtl";
	/** Accessible label if none of the heading text is suitable. */
	"aria-label"?: string;
}

export type CalendarRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "calendar";
	"data-slot": "root";
	"data-disabled"?: "";
	"data-read-only"?: "";
	"data-invalid"?: "";
};

export type CalendarHeadingAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "calendar";
	"data-slot": "heading";
};

export type CalendarNavButtonAttrs = HTMLButtonAttributes & {
	"data-kind": "calendar";
	"data-slot": "prevButton" | "nextButton";
	"data-disabled"?: "";
};

export type CalendarGridAttrs = HTMLTableAttributes & {
	"data-kind": "calendar";
	"data-slot": "grid";
	"data-disabled"?: "";
};

export type CalendarColumnHeaderAttrs = HTMLThAttributes & {
	"data-kind": "calendar";
	"data-slot": "columnHeader";
};

export type CalendarCellAttrs = HTMLButtonAttributes & {
	"data-kind": "calendar";
	"data-slot": "cell";
	"data-state"?: "selected" | "today" | "disabled" | "outside-month" | "focused";
	"data-selected"?: "";
	"data-today"?: "";
	"data-disabled"?: "";
	"data-outside-month"?: "";
	"data-focused"?: "";
};

export interface CalendarWeekDay {
	/** Full weekday name in the configured locale. */
	label: string;
	/** Short weekday abbreviation (e.g. "Mo", "Tu"). */
	abbr: string;
	/** Day index 0-6 with 0 = Sunday. */
	index: number;
}

export interface UseCalendarReturn {
	// ── Live state ──────────────────────────────────────────────
	readonly currentMonth: Date;
	readonly selectedDate: Date | null | undefined;
	readonly focusedDate: Date | null;
	readonly today: Date;
	readonly locale: string;
	readonly dir: "ltr" | "rtl";

	// ── Derived shapes ──────────────────────────────────────────
	/** Ordered weekday headers based on `firstDayOfWeek`. */
	readonly weekDays: CalendarWeekDay[];
	/** 6-row × 7-column grid of Date objects covering the visible month. */
	readonly weeks: Date[][];
	/** Month heading text in the configured locale (e.g. "April 2026"). */
	readonly headingText: string;

	// ── Slot attributes ─────────────────────────────────────────
	readonly root: CalendarRootAttrs;
	readonly heading: CalendarHeadingAttrs;
	readonly prevButton: CalendarNavButtonAttrs;
	readonly nextButton: CalendarNavButtonAttrs;
	readonly grid: CalendarGridAttrs;
	columnHeader(day: CalendarWeekDay): CalendarColumnHeaderAttrs;
	cell(date: Date): CalendarCellAttrs;

	// ── Predicates ──────────────────────────────────────────────
	isSelected(date: Date): boolean;
	isToday(date: Date): boolean;
	isDateDisabled(date: Date): boolean;
	isOutsideMonth(date: Date): boolean;
	isFocused(date: Date): boolean;

	// ── Actions ─────────────────────────────────────────────────
	setMonth(month: Date): void;
	prevMonth(): void;
	nextMonth(): void;
	prevYear(): void;
	nextYear(): void;
	selectDate(date: Date): void;
	focusDate(date: Date): void;
}

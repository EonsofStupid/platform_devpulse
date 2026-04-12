/**
 * useCalendar — ColdLight date grid primitive hook.
 *
 * Svelte 5 runes-native. Returns reactive ARIA attributes, keyboard
 * handlers, focus management, and a cell factory for building a date
 * picker that follows the WAI-APG grid + datepicker-dialog patterns.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/datepicker-dialog/
 */

import { dataAttr, disabledAttr } from "../../_internal/utils/data-attr.js";
import { kbd } from "../../_internal/utils/kbd.js";
import { createIds } from "../../_internal/utils/uid.js";
import { calendarAnatomy } from "./calendar.anatomy.js";
import type {
	CalendarCellAttrs,
	CalendarColumnHeaderAttrs,
	CalendarGridAttrs,
	CalendarHeadingAttrs,
	CalendarNavButtonAttrs,
	CalendarRootAttrs,
	CalendarWeekDay,
	UseCalendarProps,
	UseCalendarReturn,
} from "./calendar.types.js";

const WEEK_START_INDEX = {
	sun: 0,
	mon: 1,
	tue: 2,
	wed: 3,
	thu: 4,
	fri: 5,
	sat: 6,
} as const;

function startOfDay(d: Date): Date {
	const c = new Date(d);
	c.setHours(0, 0, 0, 0);
	return c;
}

function addDays(d: Date, n: number): Date {
	const c = new Date(d);
	c.setDate(c.getDate() + n);
	return c;
}

function addMonths(d: Date, n: number): Date {
	const c = new Date(d);
	c.setMonth(c.getMonth() + n);
	return c;
}

function addYears(d: Date, n: number): Date {
	const c = new Date(d);
	c.setFullYear(c.getFullYear() + n);
	return c;
}

function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

export function useCalendar(props: UseCalendarProps = {}): UseCalendarReturn {
	const ids = createIds("calendar", [
		"root",
		"heading",
		"grid",
		"prevButton",
		"nextButton",
	] as const);
	const locale = props.locale ?? "en-US";
	const dir = props.dir ?? "ltr";
	const firstDayIdx = WEEK_START_INDEX[props.firstDayOfWeek ?? "sun"];

	// ── Reactive state ──────────────────────────────────────────
	const today = startOfDay(new Date());

	const initialValue = props.defaultValue !== undefined ? props.defaultValue : null;
	const initialFocused = props.defaultFocusedValue !== undefined ? props.defaultFocusedValue : null;
	const initialMonth = props.defaultMonth ?? initialFocused ?? initialValue ?? today;

	let internalValue = $state<Date | null | undefined>(initialValue);
	let internalFocus = $state<Date | null>(initialFocused);
	let currentMonth = $state<Date>(
		startOfDay(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)),
	);

	const selectedDate = $derived(props.value !== undefined ? props.value : internalValue);
	const focusedDate = $derived(
		props.focusedValue !== undefined ? props.focusedValue : internalFocus,
	);
	const disabled = $derived(props.disabled ?? false);
	const readOnly = $derived(props.readOnly ?? false);
	const invalid = $derived(props.invalid ?? false);

	// ── Predicates ──────────────────────────────────────────────
	function isDateDisabled(date: Date): boolean {
		if (disabled) return true;
		if (props.minValue && startOfDay(date) < startOfDay(props.minValue)) return true;
		if (props.maxValue && startOfDay(date) > startOfDay(props.maxValue)) return true;
		if (props.isDateUnavailable?.(date)) return true;
		return false;
	}

	function isOutsideMonth(date: Date): boolean {
		return date.getMonth() !== currentMonth.getMonth();
	}

	function isSelected(date: Date): boolean {
		return selectedDate ? isSameDay(selectedDate, date) : false;
	}

	function isTodayDate(date: Date): boolean {
		return isSameDay(today, date);
	}

	function isFocused(date: Date): boolean {
		return focusedDate ? isSameDay(focusedDate, date) : false;
	}

	// ── Actions ─────────────────────────────────────────────────
	function setMonth(month: Date): void {
		currentMonth = startOfDay(new Date(month.getFullYear(), month.getMonth(), 1));
	}

	function prevMonth(): void {
		currentMonth = addMonths(currentMonth, -1);
	}

	function nextMonth(): void {
		currentMonth = addMonths(currentMonth, 1);
	}

	function prevYear(): void {
		currentMonth = addYears(currentMonth, -1);
	}

	function nextYear(): void {
		currentMonth = addYears(currentMonth, 1);
	}

	function doSelectDate(date: Date): void {
		if (disabled || readOnly || isDateDisabled(date)) return;
		internalValue = startOfDay(date);
		props.onValueChange?.({ value: internalValue });
	}

	function doFocusDate(date: Date): void {
		const clean = startOfDay(date);
		internalFocus = clean;
		props.onFocusChange?.({ date: clean });
		// If the focused date crosses month boundary, move the grid.
		if (
			clean.getMonth() !== currentMonth.getMonth() ||
			clean.getFullYear() !== currentMonth.getFullYear()
		) {
			setMonth(clean);
		}
	}

	// ── Focus management via $effect ────────────────────────────
	$effect(() => {
		if (!focusedDate) return;
		const el = document.querySelector<HTMLElement>(
			`#${ids.grid} [data-cell-key="${cellKey(focusedDate)}"]`,
		);
		// Only auto-focus if the grid currently contains focus to avoid
		// stealing focus from unrelated controls.
		const gridEl = document.getElementById(ids.grid);
		if (el && gridEl?.contains(document.activeElement)) {
			el.focus();
		}
	});

	function cellKey(date: Date): string {
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	}

	// ── Keyboard navigation on the grid ────────────────────────
	function handleCellKeydown(date: Date, e: KeyboardEvent): void {
		if (disabled) return;

		const target = (dayOffset: number) => doFocusDate(addDays(date, dayOffset));
		const targetMonth = (monthOffset: number) => doFocusDate(addMonths(date, monthOffset));
		const targetYear = (yearOffset: number) => doFocusDate(addYears(date, yearOffset));

		let handled = true;
		switch (e.key) {
			case kbd.ARROW_LEFT:
				target(dir === "rtl" ? 1 : -1);
				break;
			case kbd.ARROW_RIGHT:
				target(dir === "rtl" ? -1 : 1);
				break;
			case kbd.ARROW_UP:
				target(-7);
				break;
			case kbd.ARROW_DOWN:
				target(7);
				break;
			case kbd.PAGE_UP:
				if (e.shiftKey) targetYear(-1);
				else targetMonth(-1);
				break;
			case kbd.PAGE_DOWN:
				if (e.shiftKey) targetYear(1);
				else targetMonth(1);
				break;
			case kbd.HOME: {
				const dow = date.getDay();
				target(-((dow - firstDayIdx + 7) % 7));
				break;
			}
			case kbd.END: {
				const dow = date.getDay();
				target(6 - ((dow - firstDayIdx + 7) % 7));
				break;
			}
			case kbd.ENTER:
			case kbd.SPACE:
				doSelectDate(date);
				break;
			default:
				handled = false;
		}

		if (handled) e.preventDefault();
	}

	// ── Derived shapes ──────────────────────────────────────────
	const weekDays = $derived.by<CalendarWeekDay[]>(() => {
		// Build weekday labels starting at `firstDayOfWeek`.
		// Anchor on 2024-01-07 (a Sunday) + offset so toLocaleDateString produces
		// the correct weekday for the configured locale.
		const anchor = new Date(2024, 0, 7);
		return Array.from({ length: 7 }, (_, i) => {
			const idx = (firstDayIdx + i) % 7;
			const d = addDays(anchor, idx);
			return {
				index: idx,
				label: d.toLocaleDateString(locale, { weekday: "long" }),
				abbr: d.toLocaleDateString(locale, { weekday: "short" }),
			} satisfies CalendarWeekDay;
		});
	});

	const weeks = $derived.by<Date[][]>(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstOfMonth = new Date(year, month, 1);
		// Offset from the configured week start to the first of the month.
		const offset = (firstOfMonth.getDay() - firstDayIdx + 7) % 7;
		const gridStart = addDays(firstOfMonth, -offset);

		const out: Date[][] = [];
		const cursor = new Date(gridStart);
		for (let w = 0; w < 6; w++) {
			const row: Date[] = [];
			for (let d = 0; d < 7; d++) {
				row.push(new Date(cursor));
				cursor.setDate(cursor.getDate() + 1);
			}
			out.push(row);
			// Stop once we're fully past the target month and have shown
			// at least four weeks (5 with overflow).
			if (row[6].getMonth() !== month && w >= 3) break;
		}
		return out;
	});

	const headingText = $derived(
		currentMonth.toLocaleDateString(locale, { month: "long", year: "numeric" }),
	);

	// ── Slot attributes ─────────────────────────────────────────
	const root = $derived({
		...calendarAnatomy.attrs.root,
		id: ids.root,
		dir,
		"aria-labelledby": ids.heading,
		"aria-label": props["aria-label"],
		"aria-disabled": disabledAttr(disabled),
		"aria-readonly": readOnly ? true : undefined,
		"aria-invalid": invalid ? true : undefined,
		"data-disabled": dataAttr(disabled),
		"data-read-only": dataAttr(readOnly),
		"data-invalid": dataAttr(invalid),
	} as CalendarRootAttrs);

	const heading = $derived({
		...calendarAnatomy.attrs.heading,
		id: ids.heading,
		"aria-live": "polite" as const,
	} as CalendarHeadingAttrs);

	const prevButton = $derived({
		...calendarAnatomy.attrs.prevButton,
		id: ids.prevButton,
		type: "button" as const,
		"aria-label": "Previous month",
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
		disabled,
		onclick: () => prevMonth(),
	} as CalendarNavButtonAttrs);

	const nextButton = $derived({
		...calendarAnatomy.attrs.nextButton,
		id: ids.nextButton,
		type: "button" as const,
		"aria-label": "Next month",
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
		disabled,
		onclick: () => nextMonth(),
	} as CalendarNavButtonAttrs);

	const grid = $derived({
		...calendarAnatomy.attrs.grid,
		id: ids.grid,
		"aria-labelledby": ids.heading,
		"aria-disabled": disabledAttr(disabled),
		"data-disabled": dataAttr(disabled),
	} as CalendarGridAttrs);

	function columnHeader(day: CalendarWeekDay): CalendarColumnHeaderAttrs {
		return {
			...calendarAnatomy.attrs.columnHeader,
			scope: "col" as const,
			abbr: day.label,
		} as CalendarColumnHeaderAttrs;
	}

	function cell(date: Date): CalendarCellAttrs {
		const selected = isSelected(date);
		const cellDisabled = isDateDisabled(date);
		const outside = isOutsideMonth(date);
		const todayCell = isTodayDate(date);
		const focused = isFocused(date);

		// Roving tabindex: exactly one cell per grid is tabbable.
		// Preference: focused > selected > today > first day of visible month.
		const hasFocus = focusedDate != null;
		const hasSelection = selectedDate != null;
		let tabbable = false;
		if (hasFocus) tabbable = focused;
		else if (hasSelection) tabbable = selected;
		else if (todayCell && currentMonth.getMonth() === today.getMonth()) tabbable = true;
		else if (!hasFocus && !hasSelection && !todayCell && date.getDate() === 1 && !outside)
			tabbable = true;

		const state: CalendarCellAttrs["data-state"] = selected
			? "selected"
			: focused
				? "focused"
				: todayCell
					? "today"
					: cellDisabled
						? "disabled"
						: outside
							? "outside-month"
							: undefined;

		return {
			...calendarAnatomy.attrs.cell,
			type: "button" as const,
			"aria-selected": selected,
			"aria-disabled": cellDisabled ? true : undefined,
			"aria-current": todayCell ? "date" : undefined,
			"aria-label": date.toLocaleDateString(locale, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
			tabindex: tabbable && !cellDisabled ? 0 : -1,
			disabled: cellDisabled,
			"data-state": state,
			"data-selected": dataAttr(selected),
			"data-today": dataAttr(todayCell),
			"data-disabled": dataAttr(cellDisabled),
			"data-outside-month": dataAttr(outside),
			"data-focused": dataAttr(focused),
			"data-cell-key": cellKey(date),
			onclick: () => {
				doFocusDate(date);
				doSelectDate(date);
			},
			onkeydown: (e: KeyboardEvent) => handleCellKeydown(date, e),
			onfocus: () => {
				if (!focusedDate || !isSameDay(focusedDate, date)) doFocusDate(date);
			},
		} as CalendarCellAttrs;
	}

	// ── Public API ──────────────────────────────────────────────
	return {
		get currentMonth() {
			return currentMonth;
		},
		get selectedDate() {
			return selectedDate;
		},
		get focusedDate() {
			return focusedDate;
		},
		today,
		locale,
		dir,
		get weekDays() {
			return weekDays;
		},
		get weeks() {
			return weeks;
		},
		get headingText() {
			return headingText;
		},
		get root() {
			return root;
		},
		get heading() {
			return heading;
		},
		get prevButton() {
			return prevButton;
		},
		get nextButton() {
			return nextButton;
		},
		get grid() {
			return grid;
		},
		columnHeader,
		cell,
		isSelected,
		isToday: isTodayDate,
		isDateDisabled,
		isOutsideMonth,
		isFocused,
		setMonth,
		prevMonth,
		nextMonth,
		prevYear,
		nextYear,
		selectDate: doSelectDate,
		focusDate: doFocusDate,
	};
}

/**
 * useLocale — prop and return types.
 *
 * Returns the current locale and text direction.
 */

export interface UseLocaleProps {
	/** Override locale. If not provided, reads from document.documentElement.lang. */
	locale?: string;
	/** Override direction. If not provided, reads from document.documentElement.dir. */
	dir?: "ltr" | "rtl";
}

export interface UseLocaleReturn {
	/** The resolved locale string (e.g. "en-US"). */
	readonly locale: string;
	/** The resolved text direction. */
	readonly dir: "ltr" | "rtl";
}

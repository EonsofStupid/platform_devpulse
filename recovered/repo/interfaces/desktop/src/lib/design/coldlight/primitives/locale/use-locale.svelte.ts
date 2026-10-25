/**
 * useLocale — ColdLight utility primitive.
 *
 * Returns the current locale and text direction.
 * Reads from document.documentElement.lang and dir attributes,
 * or from explicitly provided props.
 *
 * @example
 * ```svelte
 * <script>
 *   import { useLocale } from '$lib/design/coldlight';
 *   const { locale, dir } = useLocale();
 * </script>
 * <div dir={dir}>Content in {locale}</div>
 * ```
 */

import type { UseLocaleProps, UseLocaleReturn } from "./locale.types.js";

const DEFAULT_LOCALE = "en-US";
const DEFAULT_DIR: "ltr" | "rtl" = "ltr";

function getDocumentLocale(): string {
	if (typeof document === "undefined") return DEFAULT_LOCALE;
	return document.documentElement.lang || DEFAULT_LOCALE;
}

function getDocumentDir(): "ltr" | "rtl" {
	if (typeof document === "undefined") return DEFAULT_DIR;
	const dir = document.documentElement.dir;
	return dir === "rtl" ? "rtl" : "ltr";
}

export function useLocale(props: UseLocaleProps = {}): UseLocaleReturn {
	const locale = $derived(props.locale ?? getDocumentLocale());
	const dir = $derived(props.dir ?? getDocumentDir());

	return {
		get locale() {
			return locale;
		},
		get dir() {
			return dir;
		},
	};
}

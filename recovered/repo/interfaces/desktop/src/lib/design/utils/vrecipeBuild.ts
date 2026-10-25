/**
 * @file utils/vrecipeBuild.ts
 * @package @devpulse/coldlight
 *
 * Build a recipe class string from constituent parts.
 */
export function vrecipeBuild(kind: string, variant?: string | null, size?: string | null): string {
	let result = kind;
	if (variant) result += `--${variant}`;
	if (size) result += `--${size}`;
	return result;
}

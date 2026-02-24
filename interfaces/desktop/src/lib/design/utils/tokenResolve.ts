/**
 * @file utils/tokenResolve.ts
 * @package @devpulse/coldlight
 *
 * Resolve a token path to its CSS custom property reference.
 * Handles both flat tokens (--space-md) and nested (--color-teal-500).
 */
export function tokenResolve(...path: string[]): string {
	return `var(--${path.join("-")})`;
}

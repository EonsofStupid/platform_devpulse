/**
 * @file utils/vrecipeParse.ts
 * @package @devpulse/coldlight
 *
 * Parse a recipe class string into its constituent parts.
 * Convention: `{kind}--{variant}--{size}` (double-dash separated).
 */
export interface RecipeParts {
	kind: string;
	variant: string | null;
	size: string | null;
	raw: string;
}

export function vrecipeParse(recipe: string): RecipeParts {
	const parts = recipe.split("--");
	return {
		kind: parts[0] ?? recipe,
		variant: parts[1] ?? null,
		size: parts[2] ?? null,
		raw: recipe,
	};
}

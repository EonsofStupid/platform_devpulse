/**
 * @file utils/vrecipeValidate.ts
 * @package @devpulse/coldlight
 *
 * Validate a recipe string against a set of known kinds.
 */
export interface RecipeValidation {
	valid: boolean;
	kind: string;
	errors: string[];
}

export function vrecipeValidate(recipe: string, knownKinds: ReadonlySet<string>): RecipeValidation {
	const parts = recipe.split("--");
	const kind = parts[0] ?? "";
	const errors: string[] = [];

	if (!kind) errors.push("Recipe must have a kind");
	if (kind && !knownKinds.has(kind)) errors.push(`Unknown kind: '${kind}'`);
	if (parts.length > 3) errors.push("Recipe has too many segments (max: kind--variant--size)");

	return { valid: errors.length === 0, kind, errors };
}

/**
 * @file Code Recipe — Structural Classes Only
 * @kind visual
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

type CodeRecipeProps = { inline?: boolean };

export function codeRecipe(props: CodeRecipeProps = {}): string {
	if (props.inline) {
		return "code-inline";
	}
	return "code-block";
}

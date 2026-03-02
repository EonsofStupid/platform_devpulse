/**
 * @file Banner Recipe — Structural Classes Only
 * @kind feedback
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

type BannerRecipeProps = { intent?: string };

export function bannerRecipe(props: BannerRecipeProps = {}): string {
	const intentMap: Record<string, string> = {
		info: "banner banner-info",
		success: "banner banner-success",
		warning: "banner banner-warning",
		error: "banner banner-error",
	};
	return intentMap[props.intent ?? "info"] ?? intentMap.info;
}

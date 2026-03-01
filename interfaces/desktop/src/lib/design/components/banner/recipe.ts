/**
 * @file Banner Recipe — Shortcode Class Composition
 * @kind feedback
 * @layer components
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (banner, banner-{intent}) handle layout + accent
 *   - Shortcode classes (v-*, s-*, e-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 */

type BannerRecipeProps = { intent?: string };

export function bannerRecipe(props: BannerRecipeProps = {}): string {
	const intentMap: Record<string, string> = {
		info: "banner banner-info v-s1",
		success: "banner banner-success v-s4",
		warning: "banner banner-warning v-s1 v-g3",
		error: "banner banner-error v-s1 v-g3",
	};
	return intentMap[props.intent ?? "info"] ?? intentMap.info;
}

/**
 * @file Circle Shape Generator
 * @layer svg
 * @package @devpulse/coldlight
 */

import type { ShapeGenerator } from "../../_schema/types.js";

export const circle: ShapeGenerator = (width, height, _radius) => {
	const r = Math.min(width, height) / 2;
	return {
		tag: "circle",
		attrs: { cx: width / 2, cy: height / 2, r },
	};
};

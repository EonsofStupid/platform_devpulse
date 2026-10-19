/**
 * @file Rect Shape Generator
 * @layer svg
 * @package @devpulse/coldlight
 */

import type { ShapeGenerator } from "../../_schema/types.js";

export const rect: ShapeGenerator = (width, height, radius) => ({
	tag: "rect",
	attrs: { x: 0, y: 0, width, height, rx: radius, ry: radius },
});

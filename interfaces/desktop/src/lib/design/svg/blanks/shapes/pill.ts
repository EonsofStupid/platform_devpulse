/**
 * @file Pill Shape Generator
 * @layer svg
 * @package @devpulse/coldlight
 */

import type { ShapeGenerator } from "../../_schema/types.js";

export const pill: ShapeGenerator = (width, height, _radius) => ({
	tag: "rect",
	attrs: { x: 0, y: 0, width, height, rx: height / 2, ry: height / 2 },
});

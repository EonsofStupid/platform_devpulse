/**
 * @file Shape Generator Registry
 * @layer svg
 * @package @devpulse/coldlight
 */

import type { BlankShape, ShapeGenerator } from "../../_schema/types.js";
import { rect } from "./rect.js";
import { pill } from "./pill.js";
import { circle } from "./circle.js";
import { hexagon } from "./hexagon.js";

const SHAPES: Record<BlankShape, ShapeGenerator> = { rect, pill, circle, hexagon };

/** Get a shape generator by name. */
export function getShape(name: BlankShape): ShapeGenerator {
	return SHAPES[name];
}

export { rect, pill, circle, hexagon };

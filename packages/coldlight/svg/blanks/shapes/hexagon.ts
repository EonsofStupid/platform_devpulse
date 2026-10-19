/**
 * @file Hexagon Shape Generator
 * @layer svg
 * @package @devpulse/coldlight
 */

import type { ShapeGenerator } from "../../_schema/types.js";

export const hexagon: ShapeGenerator = (width, height, _radius) => {
	const cx = width / 2;
	const cy = height / 2;
	const r = Math.min(width, height) / 2;
	const points = Array.from({ length: 6 }, (_, i) => {
		const angle = (Math.PI / 3) * i - Math.PI / 2;
		return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
	}).join(" ");
	return { tag: "polygon", attrs: { points } };
};

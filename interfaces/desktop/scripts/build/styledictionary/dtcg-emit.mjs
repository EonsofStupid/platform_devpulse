/**
 * @file dtcg-emit.mjs
 * @package @devpulse/coldlight
 *
 * DTCG 2025.10 emitters — the single place the generator converts
 * computed numeric primitives into spec-compliant `$value` objects.
 *
 * Canonical reference: https://www.designtokens.org/TR/2025.10/format/
 *                      https://www.designtokens.org/TR/2025.10/color/
 *
 * This module is pure — no side effects, no file I/O. Every helper
 * takes numbers + metadata, returns a JSON-serializable DTCG object.
 */

// ═══════════════════════════════════════════════════════════════
// ROUNDING
// ═══════════════════════════════════════════════════════════════

/** Round a number to 4 decimal places. Canonical precision for emitted tokens. */
export function round(n) {
	return Math.round(n * 10000) / 10000;
}

// ═══════════════════════════════════════════════════════════════
// COLOR — DTCG Color Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DTCG color token value.
 *
 * Shape:
 * ```json
 * { "colorSpace": "oklch", "components": [L, c, h], "alpha": 1, "hex": "#xxxxxx" }
 * ```
 *
 * @param {{ colorSpace: string, components: number[], alpha?: number, hex?: string }} args
 */
export function dtcgColor({ colorSpace, components, alpha = 1, hex }) {
	const value = {
		colorSpace,
		components: components.map(round),
	};
	if (alpha !== 1) value.alpha = round(alpha);
	if (hex) value.hex = hex;
	return value;
}

/**
 * OKLCH → linear sRGB, then sRGB → hex fallback.
 *
 * Minimal CSS Color 4 gamut-aware pipeline. We use the `culori`-style
 * conversion math inline so the generator has no runtime deps.
 *
 * L ∈ [0, 1], C ∈ [0, ∞), H ∈ [0, 360).
 * Returns a 6-digit hex string `#rrggbb`. Out-of-gamut colors are
 * clamped via chroma reduction until they fit in sRGB, matching the
 * CSS Color Level 4 default gamut-mapping algorithm.
 *
 * @param {number} L @param {number} C @param {number} H
 * @returns {string} `#rrggbb`
 */
export function oklchToHex(L, C, H) {
	let l = L;
	let c = C;
	const h = H;

	// Gamut-map via chroma reduction — walk c down until the converted
	// sRGB triple sits inside [0, 1]. CSS Color 4 default algorithm.
	// Up to 20 iterations is plenty for any colour reachable in display-p3.
	for (let i = 0; i < 20; i++) {
		const { r, g, b } = oklchToSrgb(l, c, h);
		if (inGamut(r) && inGamut(g) && inGamut(b)) {
			return srgbToHex(r, g, b);
		}
		c *= 0.9;
	}
	// Fall back to whatever clamp of the final attempt looks like.
	const { r, g, b } = oklchToSrgb(l, 0, h);
	return srgbToHex(r, g, b);
}

function inGamut(v) {
	return v >= -0.0001 && v <= 1.0001;
}

function oklchToSrgb(L, C, H) {
	const hRad = (H * Math.PI) / 180;
	const a = C * Math.cos(hRad);
	const b = C * Math.sin(hRad);
	return oklabToSrgb(L, a, b);
}

/**
 * OKLab → linear sRGB → sRGB (with sRGB companding).
 * Matrices from https://bottosson.github.io/posts/oklab/.
 */
function oklabToSrgb(L, a, b) {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	return {
		r: srgbCompand(rLin),
		g: srgbCompand(gLin),
		b: srgbCompand(bLin),
	};
}

function srgbCompand(v) {
	if (v <= 0.0031308) return 12.92 * v;
	return 1.055 * v ** (1 / 2.4) - 0.055;
}

function srgbToHex(r, g, b) {
	const clamp = (n) => Math.max(0, Math.min(255, Math.round(n * 255)));
	const hex = (n) => clamp(n).toString(16).padStart(2, '0');
	return `#${hex(r)}${hex(g)}${hex(b)}`;
}

// ═══════════════════════════════════════════════════════════════
// DIMENSION — DTCG Format Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DTCG dimension token value.
 *
 * Shape: `{ "value": <number>, "unit": "px" | "rem" }`
 *
 * @param {number} value
 * @param {"px" | "rem"} unit
 */
export function dtcgDimension(value, unit = 'rem') {
	return { value: round(value), unit };
}

/**
 * Build a DTCG fluid dimension TOKEN — full `{ $value, $type, $extensions? }`.
 *
 * Authoritative DTCG `$value` is the MAX (ceiling) so non-fluid-aware
 * tools get a sane static fallback. The full fluid definition travels
 * in `$extensions.com.devpulse.coldlight.fluid` — SD5 reads the
 * extension and emits a `clamp(min, slopeVw + interceptRem, max)` at
 * CSS emission time.
 *
 * Returns a full token (not just a value) because `$extensions` must
 * live at the token level alongside `$value` and `$type`. Matches the
 * contract of `dtcgGradientToken`: helpers whose name ends in `Token`
 * return full tokens; helpers without `Token` return just values.
 *
 * When `|maxPx - minPx| < 2` the token collapses to a static dimension
 * and the `$extensions` are omitted — there is no useful clamp to emit.
 *
 * @param {number} minPx
 * @param {number} maxPx
 * @param {number} [minViewport=320]
 * @param {number} [maxViewport=1440]
 * @param {number} [base=16]
 * @param {string} [description] optional `$description` for the token
 */
export function dtcgFluidDimensionToken(
	minPx,
	maxPx,
	minViewport = 320,
	maxViewport = 1440,
	base = 16,
	description,
) {
	const collapsed = Math.abs(maxPx - minPx) < 2;
	const token = {
		$value: dtcgDimension(maxPx / base, 'rem'),
		$type: 'dimension',
	};
	if (description) token.$description = description;
	if (!collapsed) {
		token.$extensions = {
			'com.devpulse.coldlight': {
				fluid: {
					min: dtcgDimension(minPx / base, 'rem'),
					max: dtcgDimension(maxPx / base, 'rem'),
					minViewport: dtcgDimension(minViewport / base, 'rem'),
					maxViewport: dtcgDimension(maxViewport / base, 'rem'),
				},
			},
		};
	}
	return token;
}

// ═══════════════════════════════════════════════════════════════
// DURATION — DTCG Format Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DTCG duration token value.
 *
 * Shape: `{ "value": <number>, "unit": "ms" | "s" }`
 *
 * @param {number} value
 * @param {"ms" | "s"} unit
 */
export function dtcgDuration(value, unit = 'ms') {
	return { value: round(value), unit };
}

// ═══════════════════════════════════════════════════════════════
// CUBIC-BEZIER — DTCG Format Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DTCG cubic-bezier token value.
 *
 * Shape: `[P1x, P1y, P2x, P2y]`
 *
 * Constraint: P1x and P2x must be in [0, 1]. P1y and P2y are
 * unbounded (allows overshoot for spring-like curves).
 *
 * @param {number} p1x @param {number} p1y @param {number} p2x @param {number} p2y
 */
export function dtcgCubicBezier(p1x, p1y, p2x, p2y) {
	return [round(p1x), round(p1y), round(p2x), round(p2y)];
}

// ═══════════════════════════════════════════════════════════════
// SHADOW — DTCG Format Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a single DTCG shadow layer value.
 *
 * Shape:
 * ```json
 * {
 *   "color":   { colorSpace, components, alpha?, hex? },
 *   "offsetX": { value, unit },
 *   "offsetY": { value, unit },
 *   "blur":    { value, unit },
 *   "spread":  { value, unit }
 * }
 * ```
 *
 * @param {object} args
 * @param {ReturnType<typeof dtcgColor>} args.color
 * @param {ReturnType<typeof dtcgDimension>} args.offsetX
 * @param {ReturnType<typeof dtcgDimension>} args.offsetY
 * @param {ReturnType<typeof dtcgDimension>} args.blur
 * @param {ReturnType<typeof dtcgDimension>} [args.spread]
 */
export function dtcgShadowLayer({ color, offsetX, offsetY, blur, spread }) {
	return {
		color,
		offsetX,
		offsetY,
		blur,
		spread: spread ?? dtcgDimension(0, 'rem'),
	};
}

/**
 * Build a DTCG shadow value, single object or array of layers.
 *
 * @param {Array<ReturnType<typeof dtcgShadowLayer>>} layers
 */
export function dtcgShadow(layers) {
	if (layers.length === 1) return layers[0];
	return layers;
}

// ═══════════════════════════════════════════════════════════════
// GRADIENT — DTCG Format Module 2025.10
// ═══════════════════════════════════════════════════════════════

/**
 * Build a DTCG gradient stop.
 *
 * @param {ReturnType<typeof dtcgColor>} color
 * @param {number} position 0..1
 */
export function dtcgGradientStop(color, position) {
	return { color, position: round(position) };
}

/**
 * Build a DTCG gradient TOKEN — full `{ $value, $type, $extensions? }`.
 *
 * Per DTCG Format Module 2025.10 § 6.5, `$value` must BE the typed
 * stops array directly. The DTCG spec is permissive about gradient
 * direction — linear vs radial vs conic and any angle metadata travel
 * in `$extensions.com.devpulse.coldlight.gradient` so the SD5
 * transform can reconstruct the full CSS function at emission time.
 *
 * This helper returns a full token (not just a value) because
 * `$extensions` must live at the token level, alongside `$value` and
 * `$type`. Compare with `dtcgColor` / `dtcgDimension` / `dtcgShadow`
 * which return values and let the caller wrap.
 *
 * @param {Array<ReturnType<typeof dtcgGradientStop>>} stops
 * @param {object} [extensions]
 * @param {"linear" | "radial" | "conic"} [extensions.kind]
 * @param {number} [extensions.angle] degrees
 * @param {string} [description] optional `$description` for the token
 */
export function dtcgGradientToken(stops, extensions, description) {
	const token = {
		$value: stops,
		$type: 'gradient',
	};
	if (description) token.$description = description;
	if (extensions) {
		token.$extensions = {
			'com.devpulse.coldlight': { gradient: extensions },
		};
	}
	return token;
}

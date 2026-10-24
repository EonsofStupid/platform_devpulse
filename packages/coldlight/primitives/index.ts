/**
 * @file Primitives — every primitive's spec and anatomy, and their contracts
 * @package @devpulse/coldlight
 * @layer primitive
 *
 * One kind: `@devpulse/coldlight/primitives/<kind>`. All of them, as
 * contract data for tooling (the VPB's A11y, SEO and Contract tabs):
 * `@devpulse/coldlight/primitives`.
 */

export { PRIMITIVES, type PrimitiveEntry, primitiveOf } from "./catalog.js";
export { toManifestComponent, toManifestPrimitive } from "./contracts.js";
export type * from "./manifest.types.js";

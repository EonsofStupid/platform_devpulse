/**
 * @file VibePulse — Devtools Suite Central Import
 * @module @devpulse/sys/debug
 * @layer lib
 *
 * VibePulse is the devtools overlay portal (V icon).
 * Every devtool registers here. Feature-gated via DEBUG_FLAG.
 *
 * Devtools:
 *   - VPB (Visual Page Builder) — lives under design/, ColdLight devtool
 *   - (future devtools register here)
 */

export { __DEV__, isDev } from "./DEBUG_FLAG";

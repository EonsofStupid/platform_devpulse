/**
 * @file sys/bindings/candle/index.ts
 * @description Candle inference runtime — config + pool restart.
 */

import { commands } from "#lib/sys/generated/bindings.js";

export const candleLoadConfig = commands.candleLoadConfig;
export const candleSaveConfig = commands.candleSaveConfig;
export const candleRestartPool = commands.candleRestartPool;

export type { CandleConfig } from "#lib/sys/generated/bindings.js";

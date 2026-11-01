/** Generate deterministic presentation dictionaries from the terminology SSOT. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";

const root = dirname(fileURLToPath(import.meta.url));
const source = resolve(root, "../../../../../systems/devpulse-engine/ip/kernel_terms.toml");
const output = resolve(root, "../../../src/lib/sys/generated/terminology.ts");
interface RawTerm {
 kernel: string; engine: string; prod: string; dev: string; category: string; context: string[];
}
interface Feature { prod: string; dev: string; }
interface Dictionary {
 terms: RawTerm[];
 features: Record<string, Feature>;
 personality: Record<string, Record<string, { messages: string[] }>>;
}
const dictionary = parse(readFileSync(source, "utf8")) as unknown as Dictionary;
const terms = Object.fromEntries(dictionary.terms.map(({ kernel, engine, prod, dev, category, context }) =>
 [engine, { kernel, engine, prod, dev, category, context }]));
const aliases = Object.fromEntries(dictionary.terms.map(term => [term.kernel, term.engine]));
if (Object.keys(terms).length !== dictionary.terms.length || Object.keys(aliases).length !== dictionary.terms.length) {
 throw new Error("Terminology keys must be unique");
}
const personality = Object.fromEntries(Object.entries(dictionary.personality).map(([agent, actions]) =>
 [agent, Object.fromEntries(Object.entries(actions).map(([action, data]) => [action, data.messages]))]));
const json = (value: unknown) => JSON.stringify(value, null, "\t");
const generated = `/**
 * AUTO-GENERATED from kernel_terms.toml. Do not edit.
 * Regenerate: pnpm generate:terminology
 */
export type PresentationMode = "simple" | "advanced";
export interface Term {
 kernel: string;
 engine: string;
 prod: string;
 dev: string;
 category: string;
 context: string[];
}
export const TERMS: Record<string, Term> = ${json(terms)};
const TECHNICAL_KEYS: Record<string, string> = ${json(aliases)};
export const CATEGORIES = ${json([...new Set(dictionary.terms.map(term => term.category))])} as const;
export type TermCategory = (typeof CATEGORIES)[number];
export const STORE_TERMS: Record<string, Term> = Object.fromEntries(
 Object.entries(TERMS).filter(([, term]) => term.category === "stores"),
);
export interface Feature { prod: string; dev: string; }
export const FEATURES: Record<string, Feature> = ${json(dictionary.features)};
export const PERSONALITY: Record<string, Record<string, string[]>> = ${json(personality)};

/** Resolve a technical identity or an existing presentation key without changing either. */
export function findTerm(name: string): Term | undefined {
 const key = Object.hasOwn(TECHNICAL_KEYS, name) ? TECHNICAL_KEYS[name] : name;
 return Object.hasOwn(TERMS, key) ? TERMS[key] : undefined;
}
export function resolveLabel(name: string, mode: PresentationMode = "simple"): string {
 const term = findTerm(name);
 return term ? (mode === "advanced" ? term.dev : term.prod) : name;
}
export function advancedLabel(name: string): string { return resolveLabel(name, "advanced"); }
export function simpleLabel(name: string): string { return resolveLabel(name, "simple"); }
/** Explicit presentation copy. Never use it to rewrite source records or IPC payloads. */
export function formatSimpleText(message: string): string {
 let result = message;
 for (const [engine, term] of Object.entries(TERMS)) result = result.replaceAll(engine, term.prod);
 return result;
}
export function minionStatus(action: string): string {
 const messages = PERSONALITY.minion?.[action];
 return messages?.length ? messages[Math.floor(Math.random() * messages.length)] : "Working...";
}
`;
writeFileSync(output, generated, "utf8");
console.log(`[terminology] Generated ${dictionary.terms.length} terms with simple and advanced labels`);

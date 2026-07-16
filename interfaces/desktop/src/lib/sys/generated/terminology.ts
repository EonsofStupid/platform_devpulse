/**
 * AUTO-GENERATED from kernel_terms.toml — DO NOT EDIT
 * Generated: 2026-07-16T00:35:55.277Z
 * Source: systems/devpulse-engine/ip/kernel_terms.toml
 *
 * Regenerate: pnpm generate:terminology
 */

export interface Term {
	engine: string;
	prod: string;
	dev: string;
	category: string;
	context: string[];
}

/** Terms indexed by engine name (what crosses the IPC boundary) */
export const TERMS: Record<string, Term> = {
	"Memory": {
		engine: "Memory",
		prod: "Memory",
		dev: "Diary Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Quality Check": {
		engine: "Quality Check",
		prod: "Quality Check",
		dev: "Guardian Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Tone Advisor": {
		engine: "Tone Advisor",
		prod: "Tone Advisor",
		dev: "Psych Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Skill Guide": {
		engine: "Skill Guide",
		prod: "Skill Guide",
		dev: "Teacher Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Translation": {
		engine: "Translation",
		prod: "Translation",
		dev: "Scribe Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Screen Reader": {
		engine: "Screen Reader",
		prod: "Screen Reader",
		dev: "Vision Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Knowledge Lookup": {
		engine: "Knowledge Lookup",
		prod: "Knowledge Lookup",
		dev: "Researcher Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"Standards Check": {
		engine: "Standards Check",
		prod: "Standards Check",
		dev: "Enforcer Agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"assistant": {
		engine: "assistant",
		prod: "assistant",
		dev: "sub-agent",
		category: "sub-agents",
		context: ["logs","traces","ui-text","errors"],
	},
	"helper": {
		engine: "helper",
		prod: "helper",
		dev: "Minion",
		category: "sub-agents",
		context: ["logs","traces","ui-text"],
	},
	"thinking": {
		engine: "thinking",
		prod: "thinking",
		dev: "rumination",
		category: "rumination",
		context: ["logs","traces","ui-text"],
	},
	"thinking step": {
		engine: "thinking step",
		prod: "thinking step",
		dev: "rumination layer",
		category: "rumination",
		context: ["logs","traces","ui-text"],
	},
	"quick read": {
		engine: "quick read",
		prod: "quick read",
		dev: "keystroke layer",
		category: "rumination",
		context: ["logs","traces"],
	},
	"context check": {
		engine: "context check",
		prod: "context check",
		dev: "pause layer",
		category: "rumination",
		context: ["logs","traces"],
	},
	"deep thinking": {
		engine: "deep thinking",
		prod: "deep thinking",
		dev: "send layer",
		category: "rumination",
		context: ["logs","traces","ui-text"],
	},
	"background analysis": {
		engine: "background analysis",
		prod: "background analysis",
		dev: "background layer",
		category: "rumination",
		context: ["logs","traces"],
	},
	"response time": {
		engine: "response time",
		prod: "response time",
		dev: "latency budget",
		category: "rumination",
		context: ["logs","traces","metrics"],
	},
	"instant": {
		engine: "instant",
		prod: "instant",
		dev: "<50ms",
		category: "rumination",
		context: ["logs","traces"],
	},
	"context ready": {
		engine: "context ready",
		prod: "context ready",
		dev: "KV cache warmth",
		category: "rumination",
		context: ["logs","traces"],
	},
	"prompt builder": {
		engine: "prompt builder",
		prod: "prompt builder",
		dev: "COSTAR+",
		category: "costar",
		context: ["logs","traces","ui-text"],
	},
	"prompt structure": {
		engine: "prompt structure",
		prod: "prompt structure",
		dev: "COSTAR",
		category: "costar",
		context: ["logs","traces","ui-text"],
	},
	"structured prompt": {
		engine: "structured prompt",
		prod: "structured prompt",
		dev: "COSTAR framework",
		category: "costar",
		context: ["logs","ui-text"],
	},
	"natural language": {
		engine: "natural language",
		prod: "natural language",
		dev: "vibe-speak",
		category: "costar",
		context: ["logs","ui-text"],
	},
	"technical specification": {
		engine: "technical specification",
		prod: "technical specification",
		dev: "engineer-speak",
		category: "costar",
		context: ["logs","ui-text"],
	},
	"smart formatting": {
		engine: "smart formatting",
		prod: "smart formatting",
		dev: "translation layer",
		category: "costar",
		context: ["logs","traces","ui-text"],
	},
	"tool optimization": {
		engine: "tool optimization",
		prod: "tool optimization",
		dev: "provider-specific frame",
		category: "costar",
		context: ["logs","traces"],
	},
	"tool-specific adjustment": {
		engine: "tool-specific adjustment",
		prod: "tool-specific adjustment",
		dev: "frame tuning",
		category: "costar",
		context: ["logs","traces"],
	},
	"context switching": {
		engine: "context switching",
		prod: "context switching",
		dev: "HMM",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"context prediction": {
		engine: "context prediction",
		prod: "context prediction",
		dev: "Hidden Markov Model",
		category: "algorithms",
		context: ["logs","traces","ui-text"],
	},
	"prediction model": {
		engine: "prediction model",
		prod: "prediction model",
		dev: "state transition matrix",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"smart ranking": {
		engine: "smart ranking",
		prod: "smart ranking",
		dev: "RRF fusion",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"combined ranking": {
		engine: "combined ranking",
		prod: "combined ranking",
		dev: "Reciprocal Rank Fusion",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"cached retrieval": {
		engine: "cached retrieval",
		prod: "cached retrieval",
		dev: "CAG",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"context-aware response": {
		engine: "context-aware response",
		prod: "context-aware response",
		dev: "CAG (Context-Augmented)",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"knowledge retrieval": {
		engine: "knowledge retrieval",
		prod: "Deep Research",
		dev: "RAG pipeline",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"knowledge-enhanced response": {
		engine: "knowledge-enhanced response",
		prod: "knowledge-enhanced response",
		dev: "RAG (Retrieval-Augmented)",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"fast serialization": {
		engine: "fast serialization",
		prod: "fast serialization",
		dev: "RKYV",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"fast data loading": {
		engine: "fast data loading",
		prod: "fast data loading",
		dev: "zero-copy deserialization",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"keyword search": {
		engine: "keyword search",
		prod: "keyword search",
		dev: "BM25",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"relevance scorer": {
		engine: "relevance scorer",
		prod: "relevance scorer",
		dev: "cross-encoder",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"semantic search": {
		engine: "semantic search",
		prod: "semantic search",
		dev: "dense retrieval",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"smart search": {
		engine: "smart search",
		prod: "smart search",
		dev: "hybrid search",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"result refinement": {
		engine: "result refinement",
		prod: "result refinement",
		dev: "reranking",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"fast generation": {
		engine: "fast generation",
		prod: "fast generation",
		dev: "speculative decoding",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"prepared context": {
		engine: "prepared context",
		prod: "prepared context",
		dev: "RRO",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"pre-processed context": {
		engine: "pre-processed context",
		prod: "pre-processed context",
		dev: "Reason Ready Object",
		category: "algorithms",
		context: ["logs","traces"],
	},
	"knowledge engine": {
		engine: "knowledge engine",
		prod: "knowledge engine",
		dev: "Connectome",
		category: "architecture",
		context: ["logs","traces","ui-text"],
	},
	"data layer": {
		engine: "data layer",
		prod: "System",
		dev: "Trinity",
		category: "architecture",
		context: ["logs","traces"],
	},
	"System relational": {
		engine: "System relational",
		prod: "System Data Store",
		dev: "LibSQL (system)",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"User relational": {
		engine: "User relational",
		prod: "User Data Store",
		dev: "LibSQL (user)",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"System analytics": {
		engine: "System analytics",
		prod: "Analytics Engine",
		dev: "DuckDB",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"Graph store": {
		engine: "Graph store",
		prod: "Connectome",
		dev: "SurrealDB",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"System cache": {
		engine: "System cache",
		prod: "Memory Cache",
		dev: "Moka",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"Vector store": {
		engine: "Vector store",
		prod: "Vector Store",
		dev: "RRO (Qdrant)",
		category: "stores",
		context: ["logs","traces","ui-text"],
	},
	"Starting": {
		engine: "Starting",
		prod: "Starting Clyffy",
		dev: "RRD: Loading",
		category: "rrd-lifecycle",
		context: ["logs","traces","ui-text"],
	},
	"Active": {
		engine: "Active",
		prod: "Clyffy active",
		dev: "RRD: Running",
		category: "rrd-lifecycle",
		context: ["logs","traces","ui-text"],
	},
	"Maintenance": {
		engine: "Maintenance",
		prod: "Clyffy maintenance",
		dev: "RRD: Paused",
		category: "rrd-lifecycle",
		context: ["logs","traces","ui-text"],
	},
	"Updating": {
		engine: "Updating",
		prod: "Updating Clyffy memory",
		dev: "RRD: Updating",
		category: "rrd-lifecycle",
		context: ["logs","traces","ui-text"],
	},
	"Error": {
		engine: "Error",
		prod: "Clyffy unavailable — see diagnostics",
		dev: "RRD: Failed",
		category: "rrd-lifecycle",
		context: ["logs","traces","ui-text","errors"],
	},
	"Pause requested": {
		engine: "Pause requested",
		prod: "Beginning maintenance",
		dev: "phase: pause_requested",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Draining requests": {
		engine: "Draining requests",
		prod: "Finishing in-flight work",
		dev: "phase: drain_begin",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Drain complete": {
		engine: "Drain complete",
		prod: "In-flight work finished",
		dev: "phase: drain_complete",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Drain timeout": {
		engine: "Drain timeout",
		prod: "Force-finishing maintenance",
		dev: "phase: drain_timeout",
		category: "rrd-lifecycle",
		context: ["logs","traces","errors"],
	},
	"Loading new memory": {
		engine: "Loading new memory",
		prod: "Loading new model",
		dev: "phase: load_begin",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Memory loaded": {
		engine: "Memory loaded",
		prod: "Model loaded",
		dev: "phase: load_complete",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Validation passed": {
		engine: "Validation passed",
		prod: "New model verified",
		dev: "phase: validate_pass",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Validation failed — keeping previous": {
		engine: "Validation failed — keeping previous",
		prod: "New model rejected — keeping previous",
		dev: "phase: validate_fail",
		category: "rrd-lifecycle",
		context: ["logs","traces","errors"],
	},
	"Switched to new memory": {
		engine: "Switched to new memory",
		prod: "New model now active",
		dev: "phase: swap_commit",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Maintenance complete": {
		engine: "Maintenance complete",
		prod: "Clyffy active again",
		dev: "phase: resume_complete",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Failed": {
		engine: "Failed",
		prod: "Clyffy hit an error",
		dev: "phase: fail",
		category: "rrd-lifecycle",
		context: ["logs","traces","errors"],
	},
	"Atomic replace": {
		engine: "Atomic replace",
		prod: "",
		dev: "arc_swap::swap()",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Drain in-flight": {
		engine: "Drain in-flight",
		prod: "",
		dev: "TaskTracker::wait()",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Pause signal": {
		engine: "Pause signal",
		prod: "",
		dev: "CancellationToken::cancel()",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"State broadcast": {
		engine: "State broadcast",
		prod: "",
		dev: "watch::Sender (RRDState)",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Hot-update component": {
		engine: "Hot-update component",
		prod: "",
		dev: "HotUpdateable trait",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
	"Maintenance window token": {
		engine: "Maintenance window token",
		prod: "",
		dev: "PauseHandle",
		category: "rrd-lifecycle",
		context: ["logs","traces"],
	},
};

/** All term categories */
export const CATEGORIES = ["sub-agents","rumination","costar","algorithms","architecture","stores","rrd-lifecycle"] as const;
export type TermCategory = (typeof CATEGORIES)[number];

/** Store terms for boot/status display — indexed by engine step name */
export const STORE_TERMS: Record<string, Term> = {
	"System relational": TERMS["System relational"],
	"User relational": TERMS["User relational"],
	"System analytics": TERMS["System analytics"],
	"Graph store": TERMS["Graph store"],
	"System cache": TERMS["System cache"],
	"Vector store": TERMS["Vector store"],
};

export interface Feature {
	enabled: boolean;
	prod: string;
	dev: string;
}

export const FEATURES: Record<string, Feature> = {
	"viper_memory": {
		enabled: false,
		prod: "Long-Term Memory",
		dev: "Viper Memory",
	},
	"clyffy_thoughts": {
		enabled: false,
		prod: "Thought Process",
		dev: "Clyffy Thoughts",
	},
	"journey_analytics": {
		enabled: false,
		prod: "Journey Insights",
		dev: "Journey Analytics",
	},
	"overmind": {
		enabled: true,
		prod: "Playground",
		dev: "OverMind",
	},
	"wiredfront": {
		enabled: true,
		prod: "Studio",
		dev: "WiredFront",
	},
	"context_debugger": {
		enabled: false,
		prod: "Context Inspector",
		dev: "Context Debugger",
	},
};

export const PERSONALITY: Record<string, Record<string, string[]>> = {
	"minion": {
		"idle": ["Awaiting orders, my lord","More work?","Ready and willing!","What shall we do today?","Stop poking me!","Me not that kind of orc!","Why you keep clicking on me?"],
		"processing": ["Doing thy bidding","Zug zug","On it, boss!","Working hard or hardly working? ...working hard.","Banana!","Something need doing?","Be happy to!","Dabu","Work work"],
		"searching": ["Searching the archives...","Looking everywhere! Even under the couch cushions.","Bottom!","Deep diving into the knowledge base","Digging through the vaults..."],
		"complete": ["Task complete! Want more work, my lord?","Done! That was fun. Got more?","Work complete. Job's done!","Finished! Wondering if there's more...","All done. Ready for the next adventure!"],
		"error": ["Hmm, that didn't go as planned...","Hit a snag. Regrouping.","Something went sideways.","Oops. Let me try a different approach.","We have a problem... but I'm on it!"],
		"booting": ["Warming up the engines...","Getting everything ready for you","Setting up your workspace","Preparing systems...","Almost there, boss!"],
	},
};

// ── Runtime functions ──────────────────────────────────────

const IS_DEV = import.meta.env.DEV;

/** Resolve label: DEV_MODE returns dev label, PROD returns prod label */
export function resolveLabel(engineTerm: string): string {
	const term = TERMS[engineTerm];
	if (!term) return engineTerm;
	return IS_DEV ? term.dev : term.prod;
}

/** Get dev label for an engine term */
export function devLabel(engineTerm: string): string {
	return TERMS[engineTerm]?.dev ?? engineTerm;
}

/** Get prod label for an engine term */
export function prodLabel(engineTerm: string): string {
	return TERMS[engineTerm]?.prod ?? engineTerm;
}

/** Get a random minion flavor message for an action */
export function minionStatus(action: string): string {
	const messages = PERSONALITY["minion"]?.[action];
	if (!messages || messages.length === 0) return "Working...";
	return messages[Math.floor(Math.random() * messages.length)];
}

/** Replace all engine terms in a string with prod labels */
export function sanitizeForProd(message: string): string {
	let result = message;
	for (const [engine, term] of Object.entries(TERMS)) {
		if (result.includes(engine)) {
			result = result.replaceAll(engine, term.prod);
		}
	}
	return result;
}

/** Check if a feature is enabled */
export function isFeatureEnabled(feature: string): boolean {
	return FEATURES[feature]?.enabled ?? false;
}

/** DEV_MODE label helper — true in dev, false in prod. Exposure/build stripping still belongs to flags.ts. */
export const DEV_MODE = IS_DEV;


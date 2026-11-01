/**
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
export const TERMS: Record<string, Term> = {
	"Memory": {
		"kernel": "DIARY",
		"engine": "Memory",
		"prod": "Memory",
		"dev": "Diary Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Quality Check": {
		"kernel": "GUARDIAN",
		"engine": "Quality Check",
		"prod": "Quality Check",
		"dev": "Guardian Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Tone Advisor": {
		"kernel": "PSYCH",
		"engine": "Tone Advisor",
		"prod": "Tone Advisor",
		"dev": "Psych Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Skill Guide": {
		"kernel": "TEACHER",
		"engine": "Skill Guide",
		"prod": "Skill Guide",
		"dev": "Teacher Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Translation": {
		"kernel": "SCRIBE",
		"engine": "Translation",
		"prod": "Translation",
		"dev": "Scribe Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Screen Reader": {
		"kernel": "VISION",
		"engine": "Screen Reader",
		"prod": "Screen Reader",
		"dev": "Vision Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Knowledge Lookup": {
		"kernel": "RESEARCHER",
		"engine": "Knowledge Lookup",
		"prod": "Knowledge Lookup",
		"dev": "Researcher Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Standards Check": {
		"kernel": "ENFORCER",
		"engine": "Standards Check",
		"prod": "Standards Check",
		"dev": "Enforcer Agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"assistant": {
		"kernel": "sub-agent",
		"engine": "assistant",
		"prod": "assistant",
		"dev": "sub-agent",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text",
			"errors"
		]
	},
	"helper": {
		"kernel": "Minion",
		"engine": "helper",
		"prod": "helper",
		"dev": "Minion",
		"category": "sub-agents",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"thinking": {
		"kernel": "rumination",
		"engine": "thinking",
		"prod": "thinking",
		"dev": "rumination",
		"category": "rumination",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"thinking step": {
		"kernel": "rumination layer",
		"engine": "thinking step",
		"prod": "thinking step",
		"dev": "rumination layer",
		"category": "rumination",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"quick read": {
		"kernel": "keystroke layer",
		"engine": "quick read",
		"prod": "quick read",
		"dev": "keystroke layer",
		"category": "rumination",
		"context": [
			"logs",
			"traces"
		]
	},
	"context check": {
		"kernel": "pause layer",
		"engine": "context check",
		"prod": "context check",
		"dev": "pause layer",
		"category": "rumination",
		"context": [
			"logs",
			"traces"
		]
	},
	"deep thinking": {
		"kernel": "send layer",
		"engine": "deep thinking",
		"prod": "deep thinking",
		"dev": "send layer",
		"category": "rumination",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"background analysis": {
		"kernel": "background layer",
		"engine": "background analysis",
		"prod": "background analysis",
		"dev": "background layer",
		"category": "rumination",
		"context": [
			"logs",
			"traces"
		]
	},
	"response time": {
		"kernel": "latency budget",
		"engine": "response time",
		"prod": "response time",
		"dev": "latency budget",
		"category": "rumination",
		"context": [
			"logs",
			"traces",
			"metrics"
		]
	},
	"instant": {
		"kernel": "<50ms",
		"engine": "instant",
		"prod": "instant",
		"dev": "<50ms",
		"category": "rumination",
		"context": [
			"logs",
			"traces"
		]
	},
	"context ready": {
		"kernel": "KV cache warmth",
		"engine": "context ready",
		"prod": "context ready",
		"dev": "KV cache warmth",
		"category": "rumination",
		"context": [
			"logs",
			"traces"
		]
	},
	"prompt builder": {
		"kernel": "COSTAR+",
		"engine": "prompt builder",
		"prod": "prompt builder",
		"dev": "COSTAR+",
		"category": "costar",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"prompt structure": {
		"kernel": "COSTAR",
		"engine": "prompt structure",
		"prod": "prompt structure",
		"dev": "COSTAR",
		"category": "costar",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"structured prompt": {
		"kernel": "Context-Objective-Style-Tone-Audience-Response",
		"engine": "structured prompt",
		"prod": "structured prompt",
		"dev": "COSTAR framework",
		"category": "costar",
		"context": [
			"logs",
			"ui-text"
		]
	},
	"natural language": {
		"kernel": "vibe-speak",
		"engine": "natural language",
		"prod": "natural language",
		"dev": "vibe-speak",
		"category": "costar",
		"context": [
			"logs",
			"ui-text"
		]
	},
	"technical specification": {
		"kernel": "engineer-speak",
		"engine": "technical specification",
		"prod": "technical specification",
		"dev": "engineer-speak",
		"category": "costar",
		"context": [
			"logs",
			"ui-text"
		]
	},
	"smart formatting": {
		"kernel": "translation layer",
		"engine": "smart formatting",
		"prod": "smart formatting",
		"dev": "translation layer",
		"category": "costar",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"tool optimization": {
		"kernel": "provider-specific frame",
		"engine": "tool optimization",
		"prod": "tool optimization",
		"dev": "provider-specific frame",
		"category": "costar",
		"context": [
			"logs",
			"traces"
		]
	},
	"tool-specific adjustment": {
		"kernel": "frame tuning",
		"engine": "tool-specific adjustment",
		"prod": "tool-specific adjustment",
		"dev": "frame tuning",
		"category": "costar",
		"context": [
			"logs",
			"traces"
		]
	},
	"context switching": {
		"kernel": "HMM",
		"engine": "context switching",
		"prod": "context switching",
		"dev": "HMM",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"context prediction": {
		"kernel": "Hidden Markov Model",
		"engine": "context prediction",
		"prod": "context prediction",
		"dev": "Hidden Markov Model",
		"category": "algorithms",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"prediction model": {
		"kernel": "state transition matrix",
		"engine": "prediction model",
		"prod": "prediction model",
		"dev": "state transition matrix",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"smart ranking": {
		"kernel": "RRF fusion",
		"engine": "smart ranking",
		"prod": "smart ranking",
		"dev": "RRF fusion",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"combined ranking": {
		"kernel": "Reciprocal Rank Fusion",
		"engine": "combined ranking",
		"prod": "combined ranking",
		"dev": "Reciprocal Rank Fusion",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"cached retrieval": {
		"kernel": "CAG",
		"engine": "cached retrieval",
		"prod": "cached retrieval",
		"dev": "CAG",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"context-aware response": {
		"kernel": "Context-Augmented Generation",
		"engine": "context-aware response",
		"prod": "context-aware response",
		"dev": "CAG (Context-Augmented)",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"knowledge retrieval": {
		"kernel": "RAG pipeline",
		"engine": "knowledge retrieval",
		"prod": "Deep Research",
		"dev": "RAG pipeline",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"knowledge-enhanced response": {
		"kernel": "Retrieval-Augmented Generation",
		"engine": "knowledge-enhanced response",
		"prod": "knowledge-enhanced response",
		"dev": "RAG (Retrieval-Augmented)",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"fast serialization": {
		"kernel": "RKYV",
		"engine": "fast serialization",
		"prod": "fast serialization",
		"dev": "RKYV",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"fast data loading": {
		"kernel": "zero-copy deserialization",
		"engine": "fast data loading",
		"prod": "fast data loading",
		"dev": "zero-copy deserialization",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"keyword search": {
		"kernel": "BM25",
		"engine": "keyword search",
		"prod": "keyword search",
		"dev": "BM25",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"relevance scorer": {
		"kernel": "cross-encoder",
		"engine": "relevance scorer",
		"prod": "relevance scorer",
		"dev": "cross-encoder",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"semantic search": {
		"kernel": "dense retrieval",
		"engine": "semantic search",
		"prod": "semantic search",
		"dev": "dense retrieval",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"smart search": {
		"kernel": "hybrid search",
		"engine": "smart search",
		"prod": "smart search",
		"dev": "hybrid search",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"result refinement": {
		"kernel": "reranking",
		"engine": "result refinement",
		"prod": "result refinement",
		"dev": "reranking",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"fast generation": {
		"kernel": "speculative decoding",
		"engine": "fast generation",
		"prod": "fast generation",
		"dev": "speculative decoding",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"prepared context": {
		"kernel": "RRO",
		"engine": "prepared context",
		"prod": "prepared context",
		"dev": "RRO",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"pre-processed context": {
		"kernel": "Reasoning Ready Object",
		"engine": "pre-processed context",
		"prod": "pre-processed context",
		"dev": "Reasoning Ready Object",
		"category": "algorithms",
		"context": [
			"logs",
			"traces"
		]
	},
	"knowledge engine": {
		"kernel": "Cortex",
		"engine": "knowledge engine",
		"prod": "knowledge engine",
		"dev": "Cortex",
		"category": "architecture",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"data layer": {
		"kernel": "Trinity",
		"engine": "data layer",
		"prod": "System",
		"dev": "Trinity",
		"category": "architecture",
		"context": [
			"logs",
			"traces"
		]
	},
	"System relational": {
		"kernel": "TursoSystemAdapter",
		"engine": "System relational",
		"prod": "System Data Store",
		"dev": "Turso (system)",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"User relational": {
		"kernel": "TursoUserAdapter",
		"engine": "User relational",
		"prod": "User Data Store",
		"dev": "Turso (user)",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"System analytics": {
		"kernel": "DuckDbAdapter",
		"engine": "System analytics",
		"prod": "Analytics Engine",
		"dev": "DuckDB",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Graph store": {
		"kernel": "SurrealAdapter",
		"engine": "Graph store",
		"prod": "Cortex",
		"dev": "SurrealDB",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"System cache": {
		"kernel": "MokaAdapter",
		"engine": "System cache",
		"prod": "Memory Cache",
		"dev": "Moka",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Vector store": {
		"kernel": "RroAdapter",
		"engine": "Vector store",
		"prod": "Vector Store",
		"dev": "RRO (Qdrant)",
		"category": "stores",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Starting": {
		"kernel": "RRD_STATE_LOADING",
		"engine": "Starting",
		"prod": "Starting Clyffy",
		"dev": "RRD: Loading",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Active": {
		"kernel": "RRD_STATE_RUNNING",
		"engine": "Active",
		"prod": "Clyffy active",
		"dev": "RRD: Running",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Maintenance": {
		"kernel": "RRD_STATE_PAUSED",
		"engine": "Maintenance",
		"prod": "Clyffy maintenance",
		"dev": "RRD: Paused",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Updating": {
		"kernel": "RRD_STATE_UPDATING",
		"engine": "Updating",
		"prod": "Updating Clyffy memory",
		"dev": "RRD: Updating",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"ui-text"
		]
	},
	"Error": {
		"kernel": "RRD_STATE_FAILED",
		"engine": "Error",
		"prod": "Clyffy unavailable — see diagnostics",
		"dev": "RRD: Failed",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"ui-text",
			"errors"
		]
	},
	"Pause requested": {
		"kernel": "RRD_PHASE_PAUSE_REQUESTED",
		"engine": "Pause requested",
		"prod": "Beginning maintenance",
		"dev": "phase: pause_requested",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Draining requests": {
		"kernel": "RRD_PHASE_DRAIN_BEGIN",
		"engine": "Draining requests",
		"prod": "Finishing in-flight work",
		"dev": "phase: drain_begin",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Drain complete": {
		"kernel": "RRD_PHASE_DRAIN_COMPLETE",
		"engine": "Drain complete",
		"prod": "In-flight work finished",
		"dev": "phase: drain_complete",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Drain timeout": {
		"kernel": "RRD_PHASE_DRAIN_TIMEOUT",
		"engine": "Drain timeout",
		"prod": "Force-finishing maintenance",
		"dev": "phase: drain_timeout",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"errors"
		]
	},
	"Loading new memory": {
		"kernel": "RRD_PHASE_LOAD_BEGIN",
		"engine": "Loading new memory",
		"prod": "Loading new model",
		"dev": "phase: load_begin",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Memory loaded": {
		"kernel": "RRD_PHASE_LOAD_COMPLETE",
		"engine": "Memory loaded",
		"prod": "Model loaded",
		"dev": "phase: load_complete",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Validation passed": {
		"kernel": "RRD_PHASE_VALIDATE_PASS",
		"engine": "Validation passed",
		"prod": "New model verified",
		"dev": "phase: validate_pass",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Validation failed — keeping previous": {
		"kernel": "RRD_PHASE_VALIDATE_FAIL",
		"engine": "Validation failed — keeping previous",
		"prod": "New model rejected — keeping previous",
		"dev": "phase: validate_fail",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"errors"
		]
	},
	"Switched to new memory": {
		"kernel": "RRD_PHASE_SWAP_COMMIT",
		"engine": "Switched to new memory",
		"prod": "New model now active",
		"dev": "phase: swap_commit",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Maintenance complete": {
		"kernel": "RRD_PHASE_RESUME_COMPLETE",
		"engine": "Maintenance complete",
		"prod": "Clyffy active again",
		"dev": "phase: resume_complete",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Failed": {
		"kernel": "RRD_PHASE_FAIL",
		"engine": "Failed",
		"prod": "Clyffy hit an error",
		"dev": "phase: fail",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces",
			"errors"
		]
	},
	"Atomic replace": {
		"kernel": "ARCSWAP_ATOMIC_REPLACE",
		"engine": "Atomic replace",
		"prod": "Replace without interruption",
		"dev": "arc_swap::swap()",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Drain in-flight": {
		"kernel": "TASKTRACKER_DRAIN",
		"engine": "Drain in-flight",
		"prod": "Finish active work",
		"dev": "TaskTracker::wait()",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Pause signal": {
		"kernel": "CANCELLATION_TOKEN_PAUSE",
		"engine": "Pause signal",
		"prod": "Pause requested",
		"dev": "CancellationToken::cancel()",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"State broadcast": {
		"kernel": "WATCH_STATE_CHANNEL",
		"engine": "State broadcast",
		"prod": "Share current state",
		"dev": "watch::Sender (RRDState)",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Hot-update component": {
		"kernel": "HOT_UPDATEABLE_TRAIT",
		"engine": "Hot-update component",
		"prod": "Component that updates while running",
		"dev": "HotUpdateable trait",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	},
	"Maintenance window token": {
		"kernel": "PAUSE_HANDLE",
		"engine": "Maintenance window token",
		"prod": "Maintenance access",
		"dev": "PauseHandle",
		"category": "rrd-lifecycle",
		"context": [
			"logs",
			"traces"
		]
	}
};
const TECHNICAL_KEYS: Record<string, string> = {
	"DIARY": "Memory",
	"GUARDIAN": "Quality Check",
	"PSYCH": "Tone Advisor",
	"TEACHER": "Skill Guide",
	"SCRIBE": "Translation",
	"VISION": "Screen Reader",
	"RESEARCHER": "Knowledge Lookup",
	"ENFORCER": "Standards Check",
	"sub-agent": "assistant",
	"Minion": "helper",
	"rumination": "thinking",
	"rumination layer": "thinking step",
	"keystroke layer": "quick read",
	"pause layer": "context check",
	"send layer": "deep thinking",
	"background layer": "background analysis",
	"latency budget": "response time",
	"<50ms": "instant",
	"KV cache warmth": "context ready",
	"COSTAR+": "prompt builder",
	"COSTAR": "prompt structure",
	"Context-Objective-Style-Tone-Audience-Response": "structured prompt",
	"vibe-speak": "natural language",
	"engineer-speak": "technical specification",
	"translation layer": "smart formatting",
	"provider-specific frame": "tool optimization",
	"frame tuning": "tool-specific adjustment",
	"HMM": "context switching",
	"Hidden Markov Model": "context prediction",
	"state transition matrix": "prediction model",
	"RRF fusion": "smart ranking",
	"Reciprocal Rank Fusion": "combined ranking",
	"CAG": "cached retrieval",
	"Context-Augmented Generation": "context-aware response",
	"RAG pipeline": "knowledge retrieval",
	"Retrieval-Augmented Generation": "knowledge-enhanced response",
	"RKYV": "fast serialization",
	"zero-copy deserialization": "fast data loading",
	"BM25": "keyword search",
	"cross-encoder": "relevance scorer",
	"dense retrieval": "semantic search",
	"hybrid search": "smart search",
	"reranking": "result refinement",
	"speculative decoding": "fast generation",
	"RRO": "prepared context",
	"Reasoning Ready Object": "pre-processed context",
	"Cortex": "knowledge engine",
	"Trinity": "data layer",
	"TursoSystemAdapter": "System relational",
	"TursoUserAdapter": "User relational",
	"DuckDbAdapter": "System analytics",
	"SurrealAdapter": "Graph store",
	"MokaAdapter": "System cache",
	"RroAdapter": "Vector store",
	"RRD_STATE_LOADING": "Starting",
	"RRD_STATE_RUNNING": "Active",
	"RRD_STATE_PAUSED": "Maintenance",
	"RRD_STATE_UPDATING": "Updating",
	"RRD_STATE_FAILED": "Error",
	"RRD_PHASE_PAUSE_REQUESTED": "Pause requested",
	"RRD_PHASE_DRAIN_BEGIN": "Draining requests",
	"RRD_PHASE_DRAIN_COMPLETE": "Drain complete",
	"RRD_PHASE_DRAIN_TIMEOUT": "Drain timeout",
	"RRD_PHASE_LOAD_BEGIN": "Loading new memory",
	"RRD_PHASE_LOAD_COMPLETE": "Memory loaded",
	"RRD_PHASE_VALIDATE_PASS": "Validation passed",
	"RRD_PHASE_VALIDATE_FAIL": "Validation failed — keeping previous",
	"RRD_PHASE_SWAP_COMMIT": "Switched to new memory",
	"RRD_PHASE_RESUME_COMPLETE": "Maintenance complete",
	"RRD_PHASE_FAIL": "Failed",
	"ARCSWAP_ATOMIC_REPLACE": "Atomic replace",
	"TASKTRACKER_DRAIN": "Drain in-flight",
	"CANCELLATION_TOKEN_PAUSE": "Pause signal",
	"WATCH_STATE_CHANNEL": "State broadcast",
	"HOT_UPDATEABLE_TRAIT": "Hot-update component",
	"PAUSE_HANDLE": "Maintenance window token"
};
export const CATEGORIES = [
	"sub-agents",
	"rumination",
	"costar",
	"algorithms",
	"architecture",
	"stores",
	"rrd-lifecycle"
] as const;
export type TermCategory = (typeof CATEGORIES)[number];
export const STORE_TERMS: Record<string, Term> = Object.fromEntries(
 Object.entries(TERMS).filter(([, term]) => term.category === "stores"),
);
export interface Feature { prod: string; dev: string; }
export const FEATURES: Record<string, Feature> = {
	"viper_memory": {
		"prod": "Long-Term Memory",
		"dev": "Viper Memory"
	},
	"clyffy_thoughts": {
		"prod": "Thought Process",
		"dev": "Clyffy Thoughts"
	},
	"journey_analytics": {
		"prod": "Journey Insights",
		"dev": "Journey Analytics"
	},
	"overmind": {
		"prod": "Playground",
		"dev": "OverMind"
	},
	"wiredfront": {
		"prod": "Studio",
		"dev": "WiredFront"
	},
	"context_debugger": {
		"prod": "Context Inspector",
		"dev": "Context Debugger"
	}
};
export const PERSONALITY: Record<string, Record<string, string[]>> = {
	"minion": {
		"idle": [
			"Awaiting orders, my lord",
			"More work?",
			"Ready and willing!",
			"What shall we do today?",
			"Stop poking me!",
			"Me not that kind of orc!",
			"Why you keep clicking on me?"
		],
		"processing": [
			"Doing thy bidding",
			"Zug zug",
			"On it, boss!",
			"Working hard or hardly working? ...working hard.",
			"Banana!",
			"Something need doing?",
			"Be happy to!",
			"Dabu",
			"Work work"
		],
		"searching": [
			"Searching the archives...",
			"Looking everywhere! Even under the couch cushions.",
			"Bottom!",
			"Deep diving into the knowledge base",
			"Digging through the vaults..."
		],
		"complete": [
			"Task complete! Want more work, my lord?",
			"Done! That was fun. Got more?",
			"Work complete. Job's done!",
			"Finished! Wondering if there's more...",
			"All done. Ready for the next adventure!"
		],
		"error": [
			"Hmm, that didn't go as planned...",
			"Hit a snag. Regrouping.",
			"Something went sideways.",
			"Oops. Let me try a different approach.",
			"We have a problem... but I'm on it!"
		],
		"booting": [
			"Warming up the engines...",
			"Getting everything ready for you",
			"Setting up your workspace",
			"Preparing systems...",
			"Almost there, boss!"
		]
	}
};

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

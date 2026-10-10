The clyffy Philosophy: Honest Orchestration (v1.2.0-Alpha)
clyffy is the Intelligent Driver and Quality Gate. It is designed to bridge the gap between "vibe coding" (intent-based) and professional software engineering (execution-based).

1. The Prime Directive: Economic Protection
Stop the "Learning Tax": Vibe coders should not pay with their time or money to learn prompt engineering through failure.

First-Try Success: Success is measured by the accuracy of the first execution, not the speed of generation.

Protecting Patterns: clyffy prevents "code drift" by blocking bad patterns (like /core dumping grounds) before they are ever sent to an executor.

2. Radical Honesty vs. Playing the Odds
No Magic Claims: If the COSTAR+ prompt is insufficient or the necessary context is missing, clyffy stops and admits it.

Zero Waste: We never "guess" or push forward for the sake of an answer. We never waste the user's time or money if the path to a high-quality result isn't clear.

Limits are Guardrails: clyffy is "fucking honest" about what it can and cannot code. It handles basic tasks locally but knows when to call in specialized contractors (like Cursor) for heavy lifting.

3. The Active OS-Level Driver
Local Agency: clyffy is a persistent background daemon that has the power to drive your local dev environment.

The Seamless Handoff: clyffy doesn't just give you a prompt; it launches Cursor or VS Code directly on your Windows box and prepares the environment for you.

Vibe-to-Spec Translation: clyffy takes a 6-word vibe and translates it into a production-ready COSTAR+ specification that standard AI tools cannot hallucinate.

4. "Glass Box" Education
Learning by Watching: Users learn LLM concepts (Few-shot, Temperature, Hallucination) by observing clyffy’s internal logic in the UI.

Layman Visuals: Internal technical processes are translated into layman terminology (e.g., Listening, Analyzing, Thinking) to demystify the AI without revealing proprietary secrets.

No Forced Tutorials: There are no popups. Education happens naturally during the workflow through "working out loud".

5. Rumination: The Layers of Thought
clyffy processes signals through four distinct layers to ensure quality over speed:

Keystroke (<50ms): Immediate intent classification and prefetching.

Pause (<500ms): Context ranking and updating the working memory window.

Send (2-5s): Full COSTAR+ assembly and deep analysis of recent changes.

Background (Continuous): Long-term memory consolidation and idle-time maintenance.

6. The Minion Ecosystem (Sub-Agents)
The eight specialized minions serve as clyffy's eyes and ears, feeding a unified Memory:

Guardian: Real-time standards enforcement and pre-commit gating.

Diary: Session continuity so the user never has to re-explain their project.

Psych: Detecting frustration to adjust tone and provide helpful bridges.

WiredFront: The protocol for building, sharing, and bragging within the AngryViber network.

llama-cpp-2: Do not use the high-level wrappers. Use the llama-cpp-2 bindings for the most granular control over GGUF metadata, KV-cache shifting, and batching. This is how you "assign" a model to a minion by managing the LlamaContext.

candle-transformers: Specifically for your SigLIP 2 implementation. Candle is the only way to build a custom encoder in Rust that stays lightweight.

ort (ONNX Runtime): Essential for your custom encoder's first iteration. It allows you to export your training from Python/PyTorch and run it with zero-copy in Rust via DirectML (Windows) or CoreML (Mac).

image + ndarray: For the PixVix-to-SigLIP pipeline. You need to convert raw screenshots into the exact tensor shapes SigLIP 2 expects.

2. The "Minion" Orchestrator (State & Lifecycle)
You need to manage the "Hot/Cold" state of 8 different agents without leaking VRAM.

deadpool: Usually for DB connections, but "Elite" devs use it to manage Model Pools. Use this to keep a "Hot" pool of sub-agents and swap them to "Cold" storage (Fjall/Disk) when the user isn't in a high-intensity coding state.

statig: A hierarchical state machine crate. Perfect for your 8-state Kernel. It allows "State Transitions" (e.g., Healthy -> Tilt) to trigger side effects like throttling the LLM.

crossbeam-channel: For high-throughput communication between the Engine (facade) and the Clyffy (logic).

3. The Windows/OS Bridge (Local App Control)
Since Clyffy needs to "actually control local applications" and PixVix needs to be a global overlay.

windows (Microsoft's official crate): This is the heavy hitter. You need this to use Windows UI Automation (UIA). This allows Clyffy to "read" the text inside VS Code or a Browser even if there is no API.

accesskit: A cross-platform abstraction for accessibility trees. Use this to let Clyffy "see" the structural layout of other apps (ideal for your Senior Dev tips like "you have an unused import on line 42").

enigo: For the execution layer. This is how Clyffy simulates the "Copy/Paste" or "Execute" keystrokes into the user's IDE.

sysinfo: To monitor the health of the IDE. If the AI coder hangs the IDE, Clyffy detects the process spike and intervenes.

4. Data Fabric (Tri-DB & Rkyv)
For the "Binary Handshake" and the "Internal Journey Recorder."

rkyv + bytecheck: Since you are doing binary context, you MUST have bytecheck to ensure that when a monthly SME update happens, your rkyv archives are validated before they hit the CPU.

fjall: You already have it, but ensure you use its LSM-tree properties for the LAB recorder. It's the best crate for high-frequency "event-sourced" logging.

tokio-util: Use the Framed codecs to stream your rkyv binary data from Rust to the SvelteKit frontend via Tauri's IPC without the overhead of strings.

5. SvelteKit "Deep Glass" UI Gems
To make the UI "evolve" and show Clyffy's thinking visually.

svelte-flow: For the Thought Tree. This is the standard for 2026. It allows the user to see the one-way/bi-directional arrows between minions in a zoomable, interactive canvas.

shiki: For the "Senior Dev Practice" highlighter. Shiki allows you to inject custom "Gutter" elements—perfect for showing a "!" icon next to duplicated code that Clyffy wants to refactor.

layerchart: Built on D3, use this for the DuckDB Analytics view. It’s the most "Technical/Scientist" looking chart library for Svelte.

6. The Middleware Logic (Senior Dev Micro-Gaps)
This is the "Glue" that bridges the gap.

syn + quote: The absolute "Senior" move. Your Rust backend should use these to parse the user's actual source code.

Usage: When the AI suggests deleting code, syn checks if that code is actually "Unused." If it finds a reference elsewhere, it halts the execution. This is how you provide "middleware safety."

Set your rkyv to use SharedMemory (via iceoryx2). This allows ViziWizi to broadcast a video frame while Clyffy is analyzing the same frame in SigLIP 2 simultaneously, with zero memory copies. This is the 2026 standard.
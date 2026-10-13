# PROMPT RECIPE EXTRACTION + CLYFFY MIDDLEWARE AUTOMATION

| Field | Value |
|-------|-------|
| **Status** | `SPEC` |
| **Version** | `1.0.0` |
| **Created** | `2026-04-07` |
| **Two Parts** | A: Prompt quality extraction + recipe UI. B: Secure browser/Windows automation. |

---

# PART A: EXTRACTING YOUR BEST PROMPTS + RECIPE INTERFACE

## The Goal

Scrape Jesse's non-frustrated, high-quality prompts from conversation
history. Identify patterns. Build a recipe interface where ANY user
can push buttons, slide sliders, type 1-2 sentences, get a perfect
COSTAR+ prompt that RAG + DB + Clyffy interactions fulfill.

---

## STEP 1: DEEP ANALYSIS METHODOLOGY

### How to extract quality prompts from your history

**What qualifies as "strong quality":**
- Clear intent in <20 words
- Resulted in ACCEPTED outcome (no corrections needed)
- Contains implicit COSTAR dimensions (context + objective minimum)
- NOT preceded by frustration signals
- Led to a productive multi-turn session

**Extraction query (run against conversation_search):**

Search terms to mine your best prompts:
```
"lets do" "we need to" "create a" "build the" "design the"
"I want" "can you" "make sure" "please" "here is what"
"the approach" "the plan" "for this" "spec for" "define the"
```

Anti-patterns to EXCLUDE:
```
"fix it" "broken" "wrong" "no" "stop" "why" "fuck" "shit"
"what the" "I said" "dude" "idiot" "how many times"
```

### Quality scoring per extracted prompt

| Signal | Weight | How to detect |
|--------|--------|---------------|
| No corrections in next 3 messages | +3 | Next messages don't start with "no", "wrong", "stop" |
| Multi-turn productive session followed | +2 | 5+ messages without correction |
| Contains specific file/module references | +1 | Regex: path-like strings, .rs/.ts/.svelte |
| Contains action verb + object | +1 | "create X", "build Y", "design Z" |
| Under 30 words | +1 | Word count |
| Over 100 words (too verbose) | -1 | Word count |
| Contains COSTAR dimensions naturally | +2 | Has context + objective + constraints |
| Preceded by frustration in prior message | -2 | PSYCH signals in prior turn |

**Score >= 4 = GOLD prompt. Extract and categorize.**

---

## STEP 2: PROMPT PATTERN CATEGORIES

From your history, your strong prompts fall into these buckets:

### Category 1: Architecture Requests
```
"lets capture all of those discussions and finalize them"
"we need to build a translator that will improve its accuracy"
"create the claude.kb and then create updated baselines"
```
**Pattern:** Directive + scope + deliverable format
**Recipe UI:** [Architecture] → What system? → What about it? → Output format?

### Category 2: Specification Requests  
```
"please provide the answers that align to our latest design"
"we want to ensure that it not only can handle itself but trained to..."
"What is the correct approach for building actual useful training data"
```
**Pattern:** Question framing + constraints + quality bar
**Recipe UI:** [Specification] → What to spec? → Constraints? → Depth?

### Category 3: Research + Analysis
```
"lets do it and confirm if real"
"find my MCP notes please the latest iteration"
"what are some easy tools I can create"
```
**Pattern:** Directive + scope + evaluation criteria
**Recipe UI:** [Research] → Topic? → Sources? → What to evaluate?

### Category 4: Implementation Directives
```
"go ahead" "continue" "lets get this implemented"
"now seeing all of this lets do one actual ultrathinking round"
```
**Pattern:** Green light + scope reference + quality modifier
**Recipe UI:** [Execute] → Which plan? → Effort level? → Constraints?

### Category 5: COSTAR-Explicit (Jesse already does this naturally)
```
"We want to only capture the obviously or confirmed strongly"
"This will be the first of two passes since we are now encompassing..."
"focusing only on claude and understanding user will be coding..."
```
**Pattern:** Scope + quality filter + audience + format
**Recipe UI:** [Custom] → Full COSTAR form with pre-fills

---

## STEP 3: THE RECIPE INTERFACE (Third Window)

### What the user sees

```
┌──────────────────────────────────────────────────────┐
│  CLYFFY PROMPT STUDIO                    [≡] [×]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  WHAT DO YOU NEED?                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ [Build] [Fix] [Plan] [Explore] [Explain]     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  QUICK DESCRIBE (1-2 sentences):                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ "add user auth with google login"            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── CLYFFY AUTO-FILLS ──────────────────────────    │
│                                                      │
│  PROJECT:    [DevPulse ▼] (from active projects)     │
│  TARGET:     [interfaces/desktop ▼] (from REPO)      │
│  PATTERN:    [Match existing auth ▼] (from REPO)     │
│  DEPTH:      [━━━━━●━━] Medium (from TEACHER)        │
│  URGENCY:    [━●━━━━━━] Low (from PSYCH)             │
│  TOOL:       [Cursor ▼] [Lovable ▼] [Claude ▼]      │
│                                                      │
│  ── GENERATED COSTAR+ ──────────────────────────    │
│  Context:  React app, TypeScript, existing auth...   │
│  Objective: Add Google OAuth via NextAuth...         │
│  Style:    Match LoginForm.tsx pattern...            │
│  Tone:     Standard technical...                     │
│  Response: Single file + integration steps...        │
│                                                      │
│  [✏️ Edit] [📋 Copy] [🚀 Execute] [📝 Plan First]  │
└──────────────────────────────────────────────────────┘
```

### How each element gets populated

| UI Element | Source | Populated by |
|-----------|--------|-------------|
| Task type buttons | User click | Direct input |
| Quick describe | User types | Direct input (1-2 sentences max) |
| Project | Active project from Turso | Auto from session state |
| Target directory | REPO recent files + project structure | Auto, user can override |
| Pattern to match | REPO pattern index | Auto from SCRIBE translation history |
| Depth slider | TEACHER assessment of user | Auto, user can override |
| Urgency slider | PSYCH current state | Auto, user can override |
| Tool selector | Detected running tools + user preference | Auto, user can override |
| COSTAR+ preview | Assembler output | Auto from all above |

### Action buttons: what happens when user clicks

| Button | What happens |
|--------|-------------|
| **Edit** | COSTAR+ fields become editable. User tweaks. Teaching moment. |
| **Copy** | Full COSTAR+ prompt copied to clipboard. User pastes into Bolt/Lovable/etc. |
| **Execute** | Clyffy sends to local brain (14B) or API. Response appears in chat. |
| **Plan First** | Clyffy breaks into phases. Numbered checklist. User approves before execute. |

### RAG + DB fulfillment for each COSTAR dimension

| Dimension | How it gets filled | Storage source |
|-----------|-------------------|---------------|
| Context | REPO recent files + DIARY session + project metadata | Qdrant (patterns) + Turso (project) + Moka (session cache) |
| Objective | SCRIBE translation of user input | Turso (translation_memory) + Qdrant (similar past translations) |
| Style | REPO pattern index + GUARDIAN code conventions | Qdrant (code patterns) + Turso (project rules) |
| Tone | TEACHER depth assessment + PSYCH urgency | In-memory (current session state) |
| Audience | Current model config + tool-specific frame | Turso (model slots) + hardcoded frame catalog |
| Response | Task type default + REPO output patterns | Hardcoded per recipe + Qdrant (past successful outputs) |

### a2ui interaction types for recipe gathering

When Clyffy needs more info to fill a dimension:

| a2ui Type | When used | Example |
|-----------|-----------|---------|
| `multiple_choice` | Ambiguous intent, 2-4 options | "Did you mean: (A) Auth login (B) Auth signup (C) Both?" |
| `example_preview` | Pattern matching, show options | "Which pattern? [SignupForm.tsx] [ProfileForm.tsx]" |
| `text_input` | Missing specific detail | "What's the OAuth provider? [Google] [GitHub] [Both]" |
| `slider` | Degree/intensity | Depth slider, urgency slider |
| `confirmation` | Before execute | "Ready to execute? Here's the plan:" |

---

## STEP 4: TRAINING DATA FROM THE RECIPE INTERFACE

Every recipe interaction generates training pairs:

```jsonl
{"ui_input":{"task":"BUILD","desc":"add user auth with google login","project":"devpulse","overrides":{}},"assembled_costar":{"context":"...","objective":"..."},"outcome":"EXECUTED","accepted":true}
{"ui_input":{"task":"FIX","desc":"login keeps timing out","project":"my-saas","overrides":{"urgency":0.8}},"assembled_costar":{"context":"...","objective":"..."},"outcome":"PLAN_FIRST","accepted":true}
```

**This is CLEANER training data than chat.** Structured input → structured output → binary outcome. No frustration noise. No ambiguity. Perfect for supervised fine-tuning.

---

# PART B: SECURE BROWSER + WINDOWS AUTOMATION (CLYFFY AS MIDDLEWARE)

## The Goal

Clyffy operates as middleware REGARDLESS of where the user's project lives.
Bolt, Lovable, Replit, Cursor, VS Code, Claude Code — Clyffy translates
the COSTAR+ prompt and DELIVERS it to the right tool, then VALIDATES the
response. The user never has to context-switch or re-explain.

---

## THREE AUTOMATION LAYERS (from our April 5 session, expanded)

### Layer 1: Browser Automation (for web tools: Bolt, Lovable, Replit)

**Options evaluated:**

| Approach | Pros | Cons | Status |
|----------|------|------|--------|
| **agent-browser (Vercel)** | Rust native CLI, screenshot+annotate+click, element refs, accessibility tree, no Playwright dep | New (Feb 2026), npm install | **RECOMMENDED** |
| **Claude in Chrome MCP** | Already connected, Anthropic-maintained | Requires Chrome, Claude dependency | Backup |
| **Playwright via subprocess** | Most mature, full browser automation | Node.js dep, heavy, not Rust-native | Rejected (dep bloat) |
| **WebView2 embedded** | Already in Tauri, zero new deps | Can't control EXTERNAL browser tabs | Wrong use case |
| **scap (CapSoftware fork)** | Screenshot capture for PixVix | Capture only, no interaction | Supplementary (vision input) |

**Recommended: agent-browser CLI as subprocess.**

```rust
// engine/src/automation/browser.rs
pub struct BrowserAgent {
    /// Spawned agent-browser process
    process: Child,
    /// Current page state
    state: BrowserState,
}

impl BrowserAgent {
    /// Navigate to a web tool
    pub async fn open(&mut self, url: &str) -> Result<()> {
        self.exec(&["open", url]).await
    }
    /// Get accessibility tree with element refs
    pub async fn snapshot(&mut self) -> Result<AccessibilityTree> {
        let output = self.exec(&["snapshot"]).await?;
        parse_snapshot(&output)
    }
    
    /// Type COSTAR+ prompt into target tool's input field
    pub async fn deliver_prompt(&mut self, tool: &WebTool, prompt: &str) -> Result<()> {
        let input_ref = tool.input_element_ref(); // e.g. "@e3" for Lovable's prompt box
        self.exec(&["fill", input_ref, prompt]).await?;
        self.exec(&["click", tool.submit_element_ref()]).await
    }
    
    /// Screenshot for VISION analysis of response
    pub async fn capture_response(&mut self) -> Result<Screenshot> {
        self.exec(&["screenshot", "--annotate", "/tmp/response.png"]).await?;
        Screenshot::from_file("/tmp/response.png")
    }
}
```

**Web tool profiles (what Clyffy needs to know about each tool):**

```toml
# shared/resources/tool_profiles/lovable.toml
[tool]
name = "Lovable"
type = "browser"
url_pattern = "https://lovable.dev/projects/*"
input_selector = "textarea[data-testid='prompt-input']"
submit_selector = "button[data-testid='send-button']"
response_area = "[data-testid='code-output']"
stack = ["React", "Vite", "TypeScript", "Supabase"]
frame_id = "lovable_v1"

[tool.quirks]
max_prompt_length = 4000
supports_file_upload = false
mobile = "PWA only"
rls_complexity = "high"

[tool]
name = "Bolt"
type = "browser"
url_pattern = "https://bolt.new/*"
# ... same pattern
```

### Layer 2: Windows Desktop Automation (for Cursor, VS Code, native apps)

**Crate: `uiautomation-rs` (v0.24.1, March 2026)**

Pure Rust wrapper for Windows UI Automation API. No Python, no Node.js.
Can find windows, read elements, send keystrokes, click buttons.

```rust
// engine/src/automation/windows.rs
use uiautomation::UIAutomation;

pub struct WindowsAgent {
    automation: UIAutomation,
}

impl WindowsAgent {
    /// Find a running application by class or name
    pub fn find_window(&self, name: &str) -> Result<WindowHandle> {
        let root = self.automation.get_root_element()?;
        let matcher = self.automation.create_matcher()
            .from(root)
            .timeout(5000)
            .name(name);
        matcher.find_first().map(WindowHandle::new)
    }
    /// Type into Cursor/VS Code prompt field
    pub fn deliver_prompt(&self, window: &WindowHandle, prompt: &str) -> Result<()> {
        window.set_focus()?;
        // Find the AI prompt input in the window
        let input = window.find_child_by_automation_id("ai-prompt-input")?;
        input.send_keys(prompt, 10)?;
        // Press Enter to submit
        input.send_keys("{enter}", 10)?;
        Ok(())
    }
    
    /// Take screenshot via scap for VISION analysis
    pub fn capture_window(&self, window: &WindowHandle) -> Result<Screenshot> {
        // Uses scap (CapSoftware fork) for high-quality capture
        scap::capture_window(window.hwnd())
    }
}
```

**Desktop tool profiles:**

```toml
# shared/resources/tool_profiles/cursor.toml
[tool]
name = "Cursor"
type = "desktop"
process_name = "Cursor.exe"
window_class = "Chrome_WidgetWin_1"  # Electron-based
input_automation_id = "ai-prompt-input"
frame_id = "cursor_v1"

[tool.quirks]
tab_autocomplete_drift = true
composer_context_loss_at = 5  # files
supports_multi_file = true
```

### Layer 3: Claude Code CLI (direct integration)

Already in your MCP server. DevPulse spawns Claude Code with stdio
transport. Full 32-tool surface. No browser or UI automation needed.

```rust
// Already exists in engine/src/claude/mod.rs
// Claude Code connects via MCP stdio to DevPulse
// COSTAR+ prompt delivered directly via signal injection
```

---

## THE PERMISSION MODEL (Critical for security)

### Principle: Clyffy NEVER acts without explicit user permission

```
┌──────────────────────────────────────────────┐
│  CLYFFY PERMISSION TIERS                      │
├──────────────────────────────────────────────┤
│                                               │
│  OBSERVE (always allowed):                    │
│    - Read screen content via scap/VISION      │
│    - Monitor running processes                │
│    - Watch file changes                       │
│    - Read accessibility tree (no interaction)  │
│                                               │
│  SUGGEST (always allowed):                    │
│    - Generate COSTAR+ prompt                  │
│    - Show translation to user                 │
│    - Recommend actions                        │
│    - Copy prompt to clipboard                 │
│                                               │
│  INTERACT (requires EXPLICIT permission):     │
│    - Type into external tool                  │
│    - Click buttons in external tool           │
│    - Submit prompts to external tool          │
│    - Navigate browser to URL                  │
│                                               │
│  EXECUTE (requires PER-ACTION confirmation):  │
│    - Run code generated by external tool      │
│    - Commit changes                           │
│    - Deploy                                   │
│    - Modify files outside project scope       │
│                                               │
└──────────────────────────────────────────────┘
```

### Permission UI

```
┌──────────────────────────────────────────────────┐
│  🐄 Clyffy wants to type into Lovable            │
│                                                    │
│  Prompt to deliver:                                │
│  "Create LoginForm component with Google OAuth..." │
│                                                    │
│  Target: lovable.dev/projects/my-saas              │
│                                                    │
│  [Allow Once] [Allow for Session] [Always Allow]   │
│  [Deny] [Show me the full prompt first]            │
└──────────────────────────────────────────────────┘
```

### Permission storage (Turso)

```sql
CREATE TABLE automation_permissions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,       -- "Lovable", "Cursor", etc
    permission_tier TEXT NOT NULL,  -- "observe", "interact", "execute"
    scope TEXT NOT NULL,            -- "once", "session", "always"
    granted_at TEXT,
    expires_at TEXT,                -- NULL for "always"
    revoked BOOLEAN DEFAULT FALSE
);
```

---

## THE COMPLETE MIDDLEWARE FLOW

```
User opens Prompt Studio (third window)
    │
    ├── Selects: [Build] + "add google auth login"
    ├── Clyffy auto-fills from REPO + DIARY + TEACHER + PSYCH
    ├── COSTAR+ assembled and previewed
    │
    ▼
User clicks [Execute] or [Copy]
    │
    ├── If [Copy]: prompt on clipboard. User pastes. Done.
    │
    ├── If [Execute] + tool = LOCAL (Clyffy brain):
    │     └── Direct inference via Candle. Response in chat.
    │
    ├── If [Execute] + tool = BROWSER (Bolt/Lovable/Replit):
    │     ├── Permission check: "Clyffy wants to type into Lovable"
    │     ├── If granted: agent-browser opens tool, types prompt
    │     ├── VISION monitors response via screenshot
    │     ├── GUARDIAN validates generated code
    │     └── Result surfaced back in DevPulse UI
    │
    ├── If [Execute] + tool = DESKTOP (Cursor/VS Code):
    │     ├── Permission check: "Clyffy wants to type into Cursor"
    │     ├── If granted: uiautomation finds window, sends keys
    │     ├── scap captures response screenshot
    │     ├── GUARDIAN validates
    │     └── Result surfaced back in DevPulse UI
    │
    └── If [Execute] + tool = CLAUDE CODE:
          ├── Already connected via MCP stdio
          ├── Prompt injected as signal
          └── Response streams back through MCP
```

---

## NEW DEPENDENCIES (Evaluation needed)

| Crate/Tool | Purpose | License | C dep? | Decision needed |
|-----------|---------|---------|--------|----------------|
| `agent-browser` (Vercel) | Browser automation CLI | MIT | No (Rust+npm) | Subprocess, not embedded. OK with single-binary? |
| `uiautomation-rs` | Windows UI Automation | MIT | Yes (Windows COM) | Windows-only. Acceptable C dep like DuckDB. |
| `scap` | Already forked (CapSoftware) | MIT | Yes (platform capture) | Already accepted. |

**agent-browser as subprocess:** Same pattern as FFmpeg. DevPulse doesn't
embed it — it shells out. User installs separately. DevPulse detects if
available and enables browser automation features. Graceful degradation:
if not installed, Copy button still works, just no auto-delivery.

**Alternative: Pure scap + SigLIP2 vision loop.** Take screenshots,
use SigLIP2 to understand what's on screen, use Windows SendKeys for
input. No external tool needed. Slower, less precise, but zero new deps.
This is the Phase 2 "fallback" approach.

---

## IMPLEMENTATION PRIORITY

| Phase | What | Effort | Deps |
|-------|------|--------|------|
| **Phase 0** | Prompt Studio UI (buttons + sliders + COSTAR+ preview) | 2W | None (Svelte + existing) |
| **Phase 0** | Copy-to-clipboard flow | 1D | None |
| **Phase 1** | Local execute (Clyffy brain) | Already exists | Candle |
| **Phase 1** | Claude Code MCP execute | Already exists | MCP server |
| **Phase 2** | Browser automation (agent-browser) | 1W | agent-browser CLI |
| **Phase 2** | Permission model + UI | 3D | Turso (exists) |
| **Phase 3** | Windows desktop automation | 1W | uiautomation-rs |
| **Phase 3** | VISION response validation loop | 2W | scap + SigLIP2 |

---

## RELATIONSHIP TO OTHER SPECS

| Spec | Connection |
|------|-----------|
| NORMALIZER_TRAINING_SPEC.md | Recipe UI generates the CLEANEST training data (structured input → outcome) |
| EMOTIONAL_TRANSLATION_LAYER.md | PSYCH feeds urgency slider in recipe UI |
| COUNTERMEASURES | CC-001 verification runs AFTER external tool response |
| BUILDABLE_TOOLS.md | Tool 2 (psych-hook) is the pre-DevPulse version of this |
| MCP internal rkyv design | Browser/Windows agent results flow through same signal bus |
| claude_integration_complete.rs | Claude Code path already built. Browser + Windows are the new paths. |

#!/usr/bin/env node
// Extract user-typed prompts from Claude Code JSONL transcripts.
// Filter: real user text (not tool_result, not auto-injected blocks),
// rage stripped, session-specific paths anonymized, trivial filler dropped.

const fs = require("fs");
const path = require("path");

const SESSIONS_DIR = "C:/Users/jessa/.claude/projects/d--localdev-platform-devpulse";
const SINCE = "2026-04-11"; // 14-day window
const OUT = "d:/localdev/platform_devpulse/docs/chat-modes/_raw/all-prompts.txt";

// Rage / abuse tokens to strip (case-insensitive). Whole-word match.
// NOTE: this list is intentionally aggressive — these tokens ride on
// frustration peaks and must NEVER end up in the chat-mode artifacts
// downstream consumers will read. Keep it broad.
const RAGE_RE =
  /\b(fucking|fucked|fuckers?|motherfuckers?|fucks?|shitty|shits|shit|damn(?:it)?|god\s*damn(?:it)?|asshole|asshat|wtf|stfu|bullshit|bs|crap|piss(?:ed)?|jfc|gdi|smh|fkin|fking|fk|nigger|nigga|fag(?:got)?|retard(?:ed)?|cunt|bitch|bastard|dipshit|jackass|moron|idiot|stupid|dumbass)\b/gi;

// Auto-injected blocks (not user typing) — strip whole tag.
const AUTO_BLOCK_RE =
  /<(ide_opened_file|ide_selection|system-reminder|task-notification|bash-input|command-name|command-message|command-args|local-command-stdout|local-command-stderr|local-command-caveat|user-prompt-submit-hook|attachment)>[\s\S]*?<\/\1>/g;

// Whole-message drop patterns (these messages are auto-emitted by the
// harness, not user typed — drop the whole prompt rather than trying to
// salvage anything inside it).
const DROP_WHOLE_RE = [
  /^\[Request interrupted by user/i,
  /^\[Request interrupted by user for tool use\]/i,
  /^This session is being continued from a previous conversation that ran out of context/i,
  /^Caveat: The messages below were generated/i,
];

// Path anonymization (per the IP rule: paths are public, but session-specific
// noise hurts clustering, so collapse known prefixes).
const PATH_SUBS = [
  [/[Dd]:[\\/]localdev[\\/]platform_devpulse[\\/]/g, "{repo}/"],
  [/[Dd]:[\\/]localdev[\\/]/g, "{localdev}/"],
  [/[Cc]:[\\/]Users[\\/]jessa[\\/]\.claude[\\/]/g, "{claude}/"],
  [/[Cc]:[\\/]Users[\\/]jessa[\\/]/g, "{home}/"],
];

const TRIVIAL_RE =
  /^(?:yes|ok|okay|continue|go|do it|commit|push|run it|sure|y|n|no|fine|whatever|next|done|✓)\.?$/i;

function listSessions() {
  return fs
    .readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({
      name: f,
      full: path.join(SESSIONS_DIR, f),
      mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtime,
    }))
    .filter((s) => s.mtime.toISOString().slice(0, 10) >= SINCE)
    .sort((a, b) => a.mtime - b.mtime);
}

function extractText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((p) => p && p.type === "text" && typeof p.text === "string")
    .map((p) => p.text)
    .join("\n");
}

function clean(text) {
  let t = text;
  t = t.replace(AUTO_BLOCK_RE, "");
  t = t.replace(RAGE_RE, "");
  for (const [re, sub] of PATH_SUBS) t = t.replace(re, sub);
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function shouldKeep(t) {
  if (t.length < 10) return false;
  if (TRIVIAL_RE.test(t)) return false;
  if (/^\W*$/.test(t)) return false;
  if (/^continue (executing|—)/i.test(t)) return false;
  for (const re of DROP_WHOLE_RE) if (re.test(t)) return false;
  return true;
}

function main() {
  const sessions = listSessions();
  console.error(`scanning ${sessions.length} sessions since ${SINCE}`);

  const blocks = [];
  let totalUserMsgs = 0;
  let kept = 0;

  for (const s of sessions) {
    const lines = fs.readFileSync(s.full, "utf8").split("\n").filter((l) => l.trim());
    let inSession = 0;
    for (const ln of lines) {
      let o;
      try {
        o = JSON.parse(ln);
      } catch {
        continue;
      }
      if (o.type !== "user" || o.message?.role !== "user") continue;
      totalUserMsgs++;
      const txt = extractText(o.message.content);
      if (!txt) continue;
      const cleaned = clean(txt);
      if (!shouldKeep(cleaned)) continue;
      blocks.push(cleaned);
      kept++;
      inSession++;
    }
    console.error(
      `  ${s.name.slice(0, 8)}…  ${s.mtime.toISOString().slice(0, 10)}  kept=${inSession}`,
    );
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, blocks.join("\n\n---\n\n"), "utf8");
  console.error(`\ntotal user msgs scanned: ${totalUserMsgs}`);
  console.error(`kept after filter:        ${kept}`);
  console.error(`written to:               ${OUT}`);
  console.error(`size:                     ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
}

main();

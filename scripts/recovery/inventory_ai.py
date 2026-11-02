"""Read-only historical AI discovery; never moves sources or marks restoration complete.

Run from the repository root with `python -B scripts/recovery/inventory_ai.py`.
The TSV includes negative results so every scanned source is accounted for.
Keywords, paths and shared symbols identify candidates, not equivalent behavior.
"""
import collections
import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import zipfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("recovery", Path(__file__).with_name("restore_history.py"))
recovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)

OUT = Path("docs/restoration")
OLD_ROOTS = ("alpha/", "archive/", "temp_docs/", "scripts/docs/")
TEXT = {".rs", ".ts", ".tsx", ".svelte", ".js", ".mjs", ".cjs", ".jsx", ".py",
        ".sql", ".surql", ".toml", ".json", ".md", ".mdx", ".txt", ".html",
        ".css", ".scss", ".yaml", ".yml", ".sh", ".ps1", ".cmd", ".gbnf", ".lock"}
FAMILIES = {
    "providers_endpoints": r"openai|anthropic|ollama|gemini|grok|codex|claude|acp|mcp|ai_providers|ChatCompletion|provider_endpoint|api_key",
    "models_inference": r"model.loader|llama|llamacpp|candle|mistral|qwen|gemma|safetensors|gguf|onnx|tokenizer|inference|huggingface|llmestimator",
    "voice_vision": r"whisper|sherpa|kokoro|piper|moshi|personaplex|voice|tts|stt|siglip|vision|phoneme",
    "memory_knowledge": r"embedding|embedder|reranker|rerank|cag|rumination|ruminate|costar|knowledge|connectome|cortex|VectorStore|MemoryStore|MemoryBlock",
    "agents_roles": r"persona|council|maestro|sub.agents?|AgentSession|AgentRole|GuardianAgent|orchestrat(?:or|ion)",
    "chat_sessions": r"chat|ChatSession|ChatMessage|transcript|banter|conversation|RoomSession",
    "factory_tickets": r"agenthub|agent.hub|overmind|agenthub_tickets|TicketAssignment|FactoryBoard",
    "training_feedback": r"fine.tun(?:e|ing)|finetun(?:e|ing)|lora|rlhf|dpo|training.dataset|TrainingExample|human.in.the.loop",
}
PATTERNS = {k: re.compile(r"(?<![a-z])(?:" + v + r")(?![a-z])", re.I) for k, v in FAMILIES.items()}
SYMBOL = re.compile(r"\b(?:struct|enum|trait|interface|class|type|fn|function)\s+([A-Za-z_]\w{5,})")
FIELDS = ["source_set", "original_path", "preserved_at", "source_ref", "original_sha256",
          "bytes", "lines", "relation", "primary_family", "families", "layer", "destination_hint",
          "preservation_status", "original_location_status", "recorded_owner", "owner_candidates", "match_basis", "review_flags", "evidence"]


def working_owner(path):
    return path.startswith(("kernel/", "systems/", "packages/coldlight/", "interfaces/desktop/src/",
                            "interfaces/desktop/src-tauri/src/")) and not any(
        s in path for s in ("/src/lib/design/", "/.cowlevel/", "/api/", "/node_modules/"))


def classify(path, body):
    """Return evidence without copying source text, URLs, credentials or prompts."""
    lower = path.lower()
    suffix = Path(path).suffix.lower()
    text = body.decode("utf-8-sig", errors="replace") if suffix in TEXT else ""
    scores, evidence = {}, []
    for family, pattern in PATTERNS.items():
        matches = list(pattern.finditer(text))
        path_hit = bool(pattern.search(path))
        if path_hit or matches:
            scores[family] = (100 if path_hit else 0) + min(len(matches), 50)
            if path_hit:
                evidence.append(f"path:{family}")
            evidence.extend(f"{family}:L{text.count(chr(10), 0, m.start()) + 1}" for m in matches[:2])
    scope = lower.startswith(("kernel/", "alpha/orchestrator/", "systems/maestro/", "crates/chat/"))
    tooling = lower.startswith((".agents/", ".agent/", ".claude/", ".codex/")) or path == "AGENTS.md"
    if tooling:
        evidence.append("path:agent_development_tooling")
    if scope:
        evidence.append("path:historical_ai_boundary")
    candidate = bool(scores) or scope or tooling
    reference = suffix in {".md", ".mdx", ".txt", ".png", ".svg", ".jpg", ".webp"} or any(
        s in lower for s in ("/.cowlevel/", "/api/", "/gen/schemas/"))
    relation = "no_ai_signal"
    if candidate:
        relation = "reference_candidate" if reference else "ai_candidate"
        if tooling:
            relation = "agent_development_tooling"
        elif scope and not scores and not reference:
            relation = "ai_boundary_support_candidate"
    primary = max(scores, key=scores.get) if scores else ("ai_boundary_support" if scope else "unclassified")
    layer = "reference" if reference else "logic"
    if tooling:
        layer = "agent_development_tooling"
    elif reference:
        layer = "reference"
    elif suffix in {".toml", ".json", ".yaml", ".yml", ".lock"} and not reference:
        layer = "configuration"
    elif suffix in {".sql", ".surql"}:
        layer = "schema_data"
    elif suffix in {".svelte", ".tsx", ".jsx", ".css", ".scss", ".html"} or "/src/lib/" in lower or "/src/routes/" in lower:
        layer = "presentation"
    elif "src-tauri/" in lower:
        layer = "desktop_bridge"
    flags = []
    for label, pattern in {
        "stub_or_todo_marker": r"\b(?:todo!|unimplemented!|placeholder\b|stub\b)",
        "embedded_runtime_review": r"candle_core|llama_cpp|sherpa_rs|llama_cpp_2|outlines_core",
        "storage_api_review": r"\blibsql\b|\bLibSqlAdapter\b",
        "endpoint_literal_review": r"https?://(?:localhost|127\.0\.0\.1|api\.openai\.com|api\.anthropic\.com|0\.0\.0\.0)",
        "ui_framework_review": r"\bgpui\b|svelte/store|from [\"']react[\"']",
    }.items():
        if re.search(pattern, text, re.I):
            flags.append(label)
    return dict(relation=relation, primary_family=primary, families=";".join(sorted(scores)), layer=layer,
                review_flags=";".join(flags), evidence=";".join(evidence) or "none", lines=len(text.splitlines()))


def destination(path, item):
    """Boundary proposal only; file-level integration still requires review."""
    family, layer = item["primary_family"], item["layer"]
    if item["relation"] == "no_ai_signal":
        return ""
    if layer == "reference":
        return "docs/ or original planning owner; reconcile existing documents"
    if layer == "agent_development_tooling":
        return "agent tooling owner; review before activating historical hooks/instructions"
    if layer == "presentation":
        if "/design/" in path or "/coldlight/" in path:
            return "packages/coldlight/ (shared presentation); domain-specific compositions under domains/*/ui/"
        domain = "agenthub" if family == "factory_tickets" else "chat"
        if family in {"models_inference", "voice_vision"}:
            domain = "clyffy"
        if family == "providers_endpoints" and "chat" not in path:
            domain = "app/providers"
        return f"interfaces/desktop/src/lib/domains/{domain}/; confirm domain before moving"
    if layer == "desktop_bridge":
        return "interfaces/desktop/src-tauri/src/commands/ bridge; AI decisions delegated to kernel"
    if family == "factory_tickets":
        return "systems/devpulse-agenthub/ + prefixed ticket persistence; AI execution remains kernel-owned"
    if family == "providers_endpoints":
        return "kernel/devpulse-clyffy/src/providers/; platform MCP tools/supervision stay engine-owned"
    if family in {"models_inference", "voice_vision"}:
        return "kernel/model-loader/ endpoint adapters/configuration; engine supervises runtime processes"
    if family in {"memory_knowledge", "training_feedback"}:
        return "kernel/devpulse-clyffy/src/cortex/; training/data pipelines may use Python"
    if family in {"agents_roles", "chat_sessions"}:
        return "kernel/devpulse-clyffy/ reasoning/session logic; engine lifecycle and Chat/Council UI remain separate"
    return "review AI boundary versus general engine infrastructure; no automatic move"


def original_location_status(path, body, root=None):
    """Compare a snapshot entry without extracting it or following paths outside the repo."""
    root = (root or Path.cwd()).resolve()
    relative = Path(path)
    if relative.is_absolute() or relative.drive or ".." in relative.parts:
        return "unsafe_path_not_compared"
    current = (root / relative).resolve()
    if not current.is_relative_to(root):
        return "unsafe_path_not_compared"
    if not current.is_file():
        return "absent"
    return "identical" if current.read_bytes() == body else "changed_requires_merge"


def collect(active):
    with Path("recovered/repo/SOURCES.tsv").open(encoding="utf-8") as stream:
        rows = list(csv.DictReader(stream, delimiter="\t"))
    sources = []
    for row in rows:
        sources.append(dict(source_set="recovery_manifest", original_path=row["path"],
            preserved_at=row["restored_to"] or "recovered/repo/" + row["recovered_as"],
            source_ref=row["copied_from"] + ":" + row["path"], recorded_owner=row["restored_to"],
            preservation_status="recorded_destination" if row["restored_to"] else "staged"))
    # Same latest-deletion boundary as restore_history.py, including all local refs.
    deleted, commit = {}, None
    for entry in recovery.git("log", "--all", "--diff-filter=D", "--name-only", "-z",
                              "--format=%x00@@%H%x00").split("\0"):
        path = entry.lstrip("\n")
        if path.startswith("@@"):
            commit = path[2:]
        elif (path and path not in active and path not in deleted
              and (path.endswith(recovery.CODE) or Path(path).name in recovery.SOURCE_NAMES)
              and not any(s in path for s in recovery.SKIP)):
            deleted[path] = commit
    for path, commit in sorted(deleted.items()):
        sources.append(dict(source_set="git_deleted_discovery", original_path=path,
            preserved_at="", source_ref=f"{commit}^:{path}", recorded_owner="", preservation_status="history_only"))
    tracked = recovery.git("ls-files", "-z").split("\0")
    for path in tracked:
        if path.startswith("recovered/devpulselabs/") or path.startswith(OLD_ROOTS):
            labs = path.startswith("recovered/devpulselabs/")
            sources.append(dict(source_set="devpulselabs" if labs else "historical_tree",
                original_path=path.removeprefix("recovered/devpulselabs/") if labs else path,
                preserved_at=path, source_ref="HEAD:" + path, recorded_owner="",
                preservation_status="import_staged" if labs else "historical_tree"))
    known, result = set(), []
    for source, (oid, body) in zip(sources, recovery.read_blobs([s["source_ref"] for s in sources])):
        key = (source["original_path"], oid)
        if key in known:
            continue
        known.add(key)
        if source["source_ref"].startswith("HEAD:"):
            source["source_ref"] = oid
        result.append((source, oid, body))
    excluded = []
    # Inspect the local recovery snapshot without extracting or executing anything.
    for snapshot in sorted(Path(".").glob("recovery-test-*")):
        archive = snapshot / "untracked.zip"
        if not archive.is_file():
            continue
        with archive.open("rb") as stream:
            digest = hashlib.file_digest(stream, "sha256").hexdigest()
        with zipfile.ZipFile(archive) as zipped:
            for entry in zipped.infolist():
                if entry.is_dir():
                    continue
                path = entry.filename.replace("\\", "/")
                if path.startswith(".vs/") or Path(path).suffix.lower() not in TEXT:
                    excluded.append(f"{archive.as_posix()}::{path}")
                    continue
                body = zipped.read(entry)
                source = dict(source_set="snapshot_zip", original_path=path,
                    preserved_at=f"{archive.as_posix()}::{path}", source_ref=f"sha256:{digest}::{path}",
                    recorded_owner="", preservation_status="snapshot_only",
                    original_location_status=original_location_status(path, body))
                result.append((source, None, body))
        for patch in sorted(snapshot.glob("*.patch")):
            body = patch.read_bytes()
            digest = hashlib.sha256(body).hexdigest()
            # Patches are fragments, not complete files or restoration destinations.
            for fragment in re.split(rb"(?m)(?=^diff --git )", body):
                match = re.match(rb"diff --git a/(.*?) b/(.*?)\r?\n", fragment)
                if not match:
                    continue
                path = match[2].decode("utf-8", errors="replace")
                source = dict(source_set="snapshot_patch", original_path=path,
                    preserved_at=f"{patch.as_posix()}::{path}", source_ref=f"sha256:{digest}::{path}",
                    recorded_owner="", preservation_status="patch_fragment")
                result.append((source, None, fragment))
    return result, excluded


def main():
    active = recovery.active_sources()
    owned = {p: oid for p, oid in active.items() if working_owner(p) and Path(p).suffix.lower() in TEXT and oid}
    by_oid, by_symbol = collections.defaultdict(list), collections.defaultdict(set)
    for path, (oid, body) in zip(owned, recovery.read_blobs(list(owned.values()))):
        by_oid[oid].append(path)
        if Path(path).suffix in {".rs", ".ts", ".svelte", ".tsx"}:
            for symbol in sorted(set(SYMBOL.findall(body.decode("utf-8", errors="replace")))):
                by_symbol[symbol].add(path)
    sources, excluded = collect(active)
    records = []
    for source, oid, body in sources:
        item = classify(source["original_path"], body)
        candidates, basis = set(by_oid.get(oid, [])) if body.strip() else set(), []
        if candidates:
            basis.append("identical_git_blob_in_working_owner")
            if source["preservation_status"] == "history_only":
                source["preservation_status"] = "verbatim_working_owner"
                source["preserved_at"] = ";".join(sorted(candidates))
        path = source["original_path"]
        if item["relation"] != "no_ai_signal":
            direct = path.replace("/connectome/", "/cortex/")
            if direct in owned:
                candidates.add(direct)
                basis.append("same_or_renamed_path_requires_diff")
            hits = collections.Counter()
            for symbol in set(SYMBOL.findall(body.decode("utf-8", errors="replace"))):
                owners = by_symbol.get(symbol, set())
                if len(symbol) >= 10 and 0 < len(owners) <= 3:
                    hits.update(owners)
            for owner, count in sorted(hits.items(), key=lambda hit: (-hit[1], hit[0]))[:5]:
                candidates.add(owner)
                basis.append(f"shared_named_symbols:{count}:{owner}")
        if source["preservation_status"] == "history_only" and oid in active.values():
            source["preservation_status"] = "verbatim_reference_or_support_only"
            source["preserved_at"] = ";".join(p for p, value in active.items() if value == oid)
        record = dict(source, **item, original_sha256=hashlib.sha256(body).hexdigest(), bytes=len(body),
            destination_hint=destination(path, item), owner_candidates=";".join(sorted(candidates)),
            match_basis=";".join(basis))
        records.append(record)
    records.sort(key=lambda r: (r["source_set"], r["original_path"], r["source_ref"]))
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "ai-inventory.tsv").open("w", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(records)
    candidates = [r for r in records if r["relation"] != "no_ai_signal"]
    summary = dict(scanned_records=len(records), candidate_records=len(candidates),
        unique_candidate_contents=len({r["original_sha256"] for r in candidates}),
        source_sets=dict(collections.Counter(r["source_set"] for r in records)),
        candidate_source_sets=dict(collections.Counter(r["source_set"] for r in candidates)),
        relations=dict(collections.Counter(r["relation"] for r in records)),
        candidate_layers=dict(collections.Counter(r["layer"] for r in candidates)),
        candidate_families=dict(collections.Counter(r["primary_family"] for r in candidates)),
        candidate_preservation=dict(collections.Counter(r["preservation_status"] for r in candidates)),
        overlapping_families=dict(collections.Counter(f for r in candidates for f in r["families"].split(";") if f)),
        excluded_snapshot_entries=excluded,
        limits=["Latest deleted revisions across local Git refs, not every historical revision.",
                "Keyword/path/symbol discovery is not a complete semantic audit or proof of functional equivalence.",
                "Snapshot patches are incomplete fragments; ignored IDE caches are not product sources.",
                "Historical roots include tracked files only; untracked content is limited to the named recovery snapshots.",
                "External repositories and machine-wide backups are not scanned; devpulselabs uses the preserved import."])
    (OUT / "ai-inventory-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in summary.items() if not k.startswith("excluded")}, indent=2))


if __name__ == "__main__":
    main()

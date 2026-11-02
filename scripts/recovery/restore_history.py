"""Bring back deleted source and supporting project files absent from HEAD
(plan 0009 R1; owner 2026-10-24: "All of it back now, then wire").

Each file is written, byte for byte, to `recovered/repo/<original path>` from
the commit just before its latest deletion; `recovered/repo/SOURCES.tsv`
records where each came from. Files whose exact content still exists in the tracked working tree
under another active path are not copied (they survive). The recovery archive
never counts as active code. Existing provenance is retained on every rerun,
and changed archived files are never overwritten. The explicit extension
list defines coverage; known build, vendor and generated directories are
excluded by SKIP. Archived documentation can itself include generated HTML.

Read-only on history: `git log`, `git ls-files`, `git ls-tree`, `git diff`,
`git cat-file`, and `git hash-object` without writes. Default recovery writes
under `recovered/repo/`. `--restore-docs`
moves verified documentation to absent original paths and records `restored_to`
before removing staging copies. Checks validate unreconciled content against
the original Git blob. Explicitly reconciled destinations require a review note
and restored_sha256; their original Git reference remains recorded, and any
remaining staging copy must still match the original blob. Unrecorded changes
fail verification rather than being overwritten.
Run from the repository root:

    python -I scripts/recovery/restore_history.py
    python -I scripts/recovery/restore_history.py --check
    python -I scripts/recovery/restore_history.py --restore-docs
"""
import argparse
import collections
import csv
import hashlib
import os
from pathlib import Path
import subprocess
import sys

CODE = (
    ".rs", ".ts", ".svelte", ".tsx", ".js", ".mjs", ".cjs", ".jsx", ".py",
    ".surql", ".sql", ".toml", ".css", ".scss", ".sass", ".less", ".vue",
    ".html", ".md", ".mdx", ".json", ".yaml", ".yml", ".txt", ".lock",
    ".sh", ".bat", ".cmd", ".ps1", ".c", ".h", ".cpp", ".hpp",
    ".svg", ".png", ".ico", ".icns", ".gif", ".webp", ".jpg", ".jpeg",
    ".ttf", ".otf", ".woff", ".woff2",
    ".gbnf", ".manifest", ".code-workspace", ".code-snippets", ".backup", ".zip",
)
SOURCE_NAMES = {".gitignore", ".gitkeep", ".keep", ".nojekyll", "phase1,md"}
SKIP = ("node_modules/", "target/", "/generated/", ".svelte-kit/", "dist/", "build/", "deps/", "recovered/")
OUT = os.path.join("recovered", "repo")
FIELDS = ["path", "recovered_as", "copied_from", "deleted_by", "deleted_on",
          "name_at_head", "deleting_commit_subject", "restored_to",
          "restored_sha256", "restoration_note"]


def git(*args, input=None, binary=False):
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        input=input if binary else (input.encode("utf-8") if input else None),
        check=True,
    )
    return result.stdout if binary else result.stdout.decode("utf-8", errors="replace")


def target_path(relative):
    root = Path(OUT).resolve()
    target = (root / relative).resolve()
    if not target.is_relative_to(root) or target == root:
        raise ValueError(f"recovery path leaves archive: {relative}")
    return target


def read_blobs(queries):
    stream = git("cat-file", "--batch", input="".join(q + "\n" for q in queries).encode(), binary=True)
    pos = 0
    for query in queries:
        end = stream.index(b"\n", pos)
        header = stream[pos:end].decode("utf-8", errors="replace").split()
        pos = end + 1
        if len(header) != 3 or header[1] != "blob":
            raise ValueError(f"cannot read source blob: {query}")
        oid, size = header[0], int(header[2])
        body = stream[pos:pos + size]
        pos += size + 1
        yield oid, body


def restored_path(relative):
    root = Path.cwd().resolve()
    target = (root / relative).resolve()
    if (not relative or not target.is_relative_to(root) or target == root
            or target.is_relative_to((root / "recovered").resolve())
            or target.is_relative_to((root / ".git").resolve())):
        raise ValueError(f"restoration path leaves active tree: {relative}")
    return target


def write_manifest(manifest, rows):
    manifest.parent.mkdir(parents=True, exist_ok=True)
    temporary = manifest.with_suffix(".tsv.tmp")
    with temporary.open("w", encoding="utf-8", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda r: (r["path"], r["copied_from"])))
    temporary.replace(manifest)


def restore_documents(manifest, rows):
    candidates = [r for r in rows if r["path"].startswith(("docs/", "temp_docs/"))
                  or Path(r["path"]).suffix.lower() in (".md", ".mdx", ".txt")]
    pending = []
    targets = set()
    # Preflight the entire set before writing any destination.
    for row in candidates:
        destination = row.get("restored_to") or row["path"]
        target = restored_path(destination)
        key = str(target).casefold()
        if key in targets:
            raise ValueError(f"conflicting documentation versions: {destination}")
        targets.add(key)
        source = target_path(row["recovered_as"])
        if row.get("restored_to"):
            if source.exists():
                if source.read_bytes() != target.read_bytes():
                    raise ValueError(f"staging and restored versions differ: {destination}")
                pending.append((row, source, target, False))
            continue
        if target.exists():
            raise ValueError(f"restoration destination already exists: {destination}")
        pending.append((row, source, target, True))
    for row, source, target, create in pending:
        if create:
            target.parent.mkdir(parents=True, exist_ok=True)
            # Exclusive creation protects a concurrent edit after preflight.
            with target.open("xb") as output:
                output.write(source.read_bytes())
            if target.read_bytes() != source.read_bytes():
                raise ValueError(f"restoration verification failed: {target}")
            row["restored_to"] = row["path"]
            # Persist provenance before removing any staging copy. Interrupted
            # runs retain either both copies or a verified recorded destination.
            write_manifest(manifest, rows)
    for row, source, target, create in pending:
        if source.read_bytes() != target.read_bytes():
            raise ValueError(f"restoration changed before staging removal: {target}")
        source.unlink()
    print(f"documentation restored to original locations: {sum(p[3] for p in pending)}")


def active_sources():
    """Use pending tracked changes too: a HEAD copy can already be edited or gone."""
    active = {}
    for entry in git("ls-tree", "-r", "-z", "HEAD").split("\0"):
        if not entry:
            continue
        metadata, path = entry.split("\t", 1)
        if path.startswith("recovered/"):
            continue
        _mode, kind, oid = metadata.split()
        active[path] = oid if kind == "blob" else None
    tracked = set(git("ls-files", "-z").split("\0"))
    for path in git("diff", "--name-only", "-z", "HEAD", "--").split("\0"):
        if not path or path.startswith("recovered/"):
            continue
        if path not in tracked:
            # A staged deletion can leave an untracked replacement on disk;
            # that replacement will not accompany the pending commit.
            active.pop(path, None)
            continue
        target = Path(path)
        if target.is_symlink():
            # Hash the link itself, never read a target outside the repository.
            active[path] = git("hash-object", "--stdin", binary=True,
                               input=os.fsencode(os.readlink(target))).decode().strip()
        elif target.is_file():
            active[path] = git("hash-object", "--", path).strip()
        else:
            active.pop(path, None)
    return active


def restore(check=False, documents=False):
    manifest = Path(OUT) / "SOURCES.tsv"
    rows = []
    if manifest.exists():
        with manifest.open(encoding="utf-8", newline="") as source:
            rows = list(csv.DictReader(source, delimiter="\t"))
    # Verify the whole existing archive before making any changes.
    queries = [f"{r['copied_from']}:{r['path']}" for r in rows]
    taken = set()
    known = set()
    for row, (oid, body) in zip(rows, read_blobs(queries)):
        target = (restored_path(row["restored_to"]) if row.get("restored_to")
                  else target_path(row["recovered_as"]))
        digest = row.get("restored_sha256")
        if digest and (not row.get("restored_to") or not row.get("restoration_note")):
            raise ValueError(f"reconciled source requires a destination and review note: {target}")
        matches = target.is_file() and (
            hashlib.sha256(target.read_bytes()).hexdigest() == digest
            if digest else target.read_bytes() == body
        )
        if not matches:
            raise ValueError(f"recovered file missing or changed; refusing overwrite: {target}")
        # A reconciled implementation may change APIs while preserving the
        # original revision in Git. Any remaining staging copy must still be
        # exact, even when the active destination has a reviewed digest.
        staged = target_path(row["recovered_as"])
        if row.get("restored_to") and staged.exists() and staged.read_bytes() != body:
            raise ValueError(f"staging copy changed after restoration: {staged}")
        key = row["recovered_as"].lower()
        if key in taken:
            raise ValueError(f"duplicate recovery target: {key}")
        taken.add(key)
        known.add((row["path"], oid))

    active = active_sources()
    head = set(active)
    head_blobs = {oid for oid in active.values() if oid is not None}
    head_names = collections.Counter(path.rsplit("/", 1)[-1] for path in head)

    # The latest deletion of each path, newest first across every branch.
    deleted = {}
    commit = None
    for entry in git(
        "log", "--all", "--diff-filter=D", "--name-only", "-z", "--date=short",
        "--format=%x00@@%H|%ad|%s%x00"
    ).split("\0"):
        line = entry.lstrip("\n")
        if line.startswith("@@"):
            commit = line[2:].split("|", 2)
            continue
        path = line
        if not path or path in head or path in deleted:
            continue
        if not (path.endswith(CODE) or path.rsplit("/", 1)[-1] in SOURCE_NAMES):
            continue
        if any(s in path for s in SKIP):
            continue
        deleted[path] = commit

    # Fetch each file as it was just before its deletion, in one batch.
    paths = list(deleted)
    queries = [f"{deleted[p][0]}^:{p}" for p in paths]
    written = survived = 0
    for path, (oid, body) in zip(paths, read_blobs(queries)):
        if (path, oid) in known:
            continue
        if oid in head_blobs:
            survived += 1
            continue
        sha, date, subject = deleted[path]
        # Two versions whose paths differ only in case (`HStack.svelte`,
        # `Hstack.svelte`) would overwrite each other on a case-insensitive
        # disk; the second keeps its source commit in its name.
        recovered_as = path
        if recovered_as.lower() in taken:
            stem, dot, ext = path.rpartition(".")
            recovered_as = f"{stem}@{sha}.{ext}" if dot else f"{path}@{sha}"
        if recovered_as.lower() in taken:
            raise ValueError(f"recovery target collision: {recovered_as}")
        taken.add(recovered_as.lower())
        target = target_path(recovered_as)
        if check:
            print(f"unrecovered source: {path} ({sha[:8]}^)")
        if target.exists() and target.read_bytes() != body:
            raise ValueError(f"unrecorded recovered file differs; refusing overwrite: {target}")
        if not check:
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                target.write_bytes(body)
        written += 1
        name = path.rsplit("/", 1)[-1]
        rows.append(dict(zip(FIELDS, [
                    path,
                    recovered_as,
                    # The deletion may exist only on a local safety branch.
                    # Reference its actual source commit, not that branch's child.
                    git("rev-parse", f"{sha}^").strip(),
                    sha[:8],
                    date,
                    "yes" if head_names.get(name) else "no",
                    subject.replace("\t", " "),
                ])))

    if not check and (written or not manifest.exists()):
        write_manifest(manifest, rows)
    if documents:
        restore_documents(manifest, rows)
    print(f"verified preserved sources: {len(known)}; {'unrecovered' if check else 'added'}: {written}; "
          f"survive verbatim in active working tree: {survived}")
    return int(check and written > 0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="verify staged/restored content and coverage without writing")
    mode.add_argument("--restore-docs", action="store_true", help="restore staged documentation to its original paths")
    args = parser.parse_args()
    try:
        return restore(check=args.check, documents=args.restore_docs)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"Recovery failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

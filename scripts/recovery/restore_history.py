"""Bring back deleted source and supporting project files absent from HEAD
(plan 0009 R1; owner 2026-10-24: "All of it back now, then wire").

Each file is written, byte for byte, to `recovered/repo/<original path>` from
the commit just before its latest deletion; `recovered/repo/SOURCES.tsv`
records where each came from. Files whose exact content still exists at HEAD
under another active path are not copied (they survive). The recovery archive
never counts as active code. Existing provenance is retained on every rerun,
and changed archived files are never overwritten. The explicit extension
list defines coverage; known build, vendor and generated directories are
excluded by SKIP. Archived documentation can itself include generated HTML.

Read-only on history: `git log`, `git ls-files`, `git ls-tree`, `git
cat-file`. Writes only under `recovered/repo/`. Run from the repository root:

    python -I scripts/recovery/restore_history.py
    python -I scripts/recovery/restore_history.py --check
"""
import argparse
import collections
import csv
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
          "name_at_head", "deleting_commit_subject"]


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


def restore(check=False):
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
        target = target_path(row["recovered_as"])
        if not target.is_file() or target.read_bytes() != body:
            raise ValueError(f"recovered file missing or changed; refusing overwrite: {target}")
        key = row["recovered_as"].lower()
        if key in taken:
            raise ValueError(f"duplicate recovery target: {key}")
        taken.add(key)
        known.add((row["path"], oid))

    head = set()
    head_blobs = set()
    for entry in git("ls-tree", "-r", "-z", "HEAD").split("\0"):
        if not entry:
            continue
        metadata, path = entry.split("\t", 1)
        if path.startswith("recovered/"):
            continue
        head.add(path)
        mode, kind, oid = metadata.split()
        if kind == "blob":
            head_blobs.add(oid)
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
                    f"{sha[:8]}^",
                    sha[:8],
                    date,
                    "yes" if head_names.get(name) else "no",
                    subject.replace("\t", " "),
                ])))

    if not check and (written or not manifest.exists()):
        manifest.parent.mkdir(parents=True, exist_ok=True)
        temporary = manifest.with_suffix(".tsv.tmp")
        with temporary.open("w", encoding="utf-8", newline="") as out:
            writer = csv.DictWriter(out, fieldnames=FIELDS, delimiter="\t", lineterminator="\n")
            writer.writeheader()
            writer.writerows(sorted(rows, key=lambda r: (r["path"], r["copied_from"])))
        temporary.replace(manifest)
    print(f"verified archive: {len(known)}; {'unrecovered' if check else 'added'}: {written}; "
          f"survive verbatim in active HEAD: {survived}")
    return int(check and written > 0)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify archive and coverage without writing")
    args = parser.parse_args()
    try:
        return restore(check=args.check)
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"Recovery failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

"""Bring back every code file this repo's history deleted that is not at HEAD
(plan 0009 R1; owner 2026-10-24: "All of it back now, then wire").

Each file is written, byte for byte, to `recovered/repo/<original path>` from
the commit just before its latest deletion; `recovered/repo/SOURCES.tsv`
records where each came from. Files whose exact content still exists at HEAD
under another path are not copied (they survive). Build output, vendored
`deps/` and generated files are not code to recover.

Read-only on history: `git log`, `git ls-files`, `git ls-tree`, `git
cat-file`. Writes only under `recovered/repo/`. Run from the repository root:

    python -I scripts/recovery/restore_history.py
"""
import collections
import os
import subprocess
import sys

CODE = (".rs", ".ts", ".svelte", ".tsx", ".js", ".mjs", ".py", ".surql", ".sql", ".toml", ".css")
SKIP = ("node_modules/", "target/", "/generated/", ".svelte-kit/", "dist/", "build/", "deps/")
OUT = os.path.join("recovered", "repo")


def git(*args, input=None, binary=False):
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        input=input if binary else (input.encode("utf-8") if input else None),
        check=True,
    )
    return result.stdout if binary else result.stdout.decode("utf-8", errors="replace")


def main():
    head = set(git("ls-files").splitlines())
    head_names = collections.Counter(path.rsplit("/", 1)[-1] for path in head)
    head_blobs = {
        line.split()[2]
        for line in git("ls-tree", "-r", "HEAD").splitlines()
        if line.split()[1] == "blob"
    }

    # The latest deletion of each path, newest first across every branch.
    deleted = {}
    commit = None
    for line in git(
        "log", "--all", "--diff-filter=D", "--name-only", "--date=short", "--format=@@%H|%ad|%s"
    ).splitlines():
        if line.startswith("@@"):
            commit = line[2:].split("|", 2)
            continue
        path = line.strip()
        if not path or path in head or path in deleted:
            continue
        if not path.endswith(CODE) or any(s in path for s in SKIP):
            continue
        deleted[path] = commit

    # Fetch each file as it was just before its deletion, in one batch.
    paths = list(deleted)
    query = "".join(f"{deleted[p][0]}^:{p}\n" for p in paths).encode("utf-8")
    stream = git("cat-file", "--batch", input=query, binary=True)
    written = survived = missing = 0
    rows = []
    taken = set()  # targets, lowercased: Windows and macOS ignore case
    pos = 0
    for path in paths:
        end = stream.index(b"\n", pos)
        header = stream[pos:end].decode("utf-8", errors="replace").split()
        pos = end + 1
        if len(header) != 3 or header[1] != "blob":
            missing += 1
            continue
        oid, size = header[0], int(header[2])
        body = stream[pos : pos + size]
        pos += size + 1  # the blob, then a newline
        if oid in head_blobs:
            survived += 1
            continue
        sha, date, subject = deleted[path]
        # Two versions whose paths differ only in case (`HStack.svelte`,
        # `Hstack.svelte`) would overwrite each other on a case-insensitive
        # disk; the second keeps its source commit in its name.
        recovered_as = path
        if path.lower() in taken:
            stem, dot, ext = path.rpartition(".")
            recovered_as = f"{stem}@{sha[:8]}.{ext}" if dot else f"{path}@{sha[:8]}"
        taken.add(recovered_as.lower())
        target = os.path.join(OUT, *recovered_as.split("/"))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "wb") as f:
            f.write(body)
        written += 1
        name = path.rsplit("/", 1)[-1]
        rows.append(
            "\t".join(
                [
                    path,
                    recovered_as,
                    f"{sha[:8]}^",
                    sha[:8],
                    date,
                    "yes" if head_names.get(name) else "no",
                    subject.replace("\t", " "),
                ]
            )
        )

    rows.sort()
    with open(os.path.join(OUT, "SOURCES.tsv"), "w", encoding="utf-8", newline="\n") as f:
        f.write(
            "path\trecovered_as\tcopied_from\tdeleted_by\tdeleted_on\tname_at_head\t"
            "deleting_commit_subject\n"
        )
        f.write("\n".join(rows) + "\n")
    print(f"written: {written}; survive verbatim at HEAD (not copied): {survived}; unreadable: {missing}")
    return 0 if missing == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

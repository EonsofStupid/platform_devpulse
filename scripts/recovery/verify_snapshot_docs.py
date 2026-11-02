"""Verify restored snapshot documents without needing or extracting the private ZIP.

Run from the repository root. --index verifies exactly what Git will commit.
This audit covers source preservation, not implementation or current spec approval.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess

LEDGER = "docs/restoration/snapshot-documents.json"


def read_document(path, index=False):
    relative = PurePosixPath(path)
    if (relative.is_absolute() or ".." in relative.parts or "\\" in path
            or not path.startswith(("docs/", "scripts/docs/"))):
        raise ValueError(f"Not a repository document: {path}")
    target = Path(path).resolve()
    if not target.is_relative_to(Path.cwd().resolve()):
        raise ValueError(f"Document leaves repository: {path}")
    if index:
        return subprocess.check_output(["git", "show", ":" + path])
    return target.read_bytes()


def check_record(record, body):
    def check(part, expected, label):
        if hashlib.sha256(part).hexdigest() != expected:
            raise ValueError(f"{record['path']}: {label} differs from restoration ledger")

    check(body, record["destination_sha256"], "destination")
    for kind in ("source", "previous"):
        if kind == "previous" and "previous_sha256" not in record:
            continue
        start, size = record[kind + "_offset"], record[kind + "_bytes"]
        if not isinstance(start, int) or not isinstance(size, int) or start < 0 or size < 0 or start + size > len(body):
            raise ValueError(f"{record['path']}: invalid {kind} range")
        check(body[start:start + size], record[kind + "_sha256"], kind)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", action="store_true")
    args = parser.parse_args()
    ledger = json.loads(read_document(LEDGER, args.index))
    seen = set()
    for record in ledger["records"]:
        path = record["path"]
        if path in seen:
            raise ValueError(f"Duplicate document: {path}")
        seen.add(path)
        check_record(record, read_document(path, args.index))
    print(f"Verified {len(seen)} restored documents, including source and retained prior revisions ({'Git index' if args.index else 'working tree'}).")


if __name__ == "__main__":
    main()

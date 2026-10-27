"""Real Git regressions for archive preservation; no application files touched."""
import csv
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("restore_history.py").resolve()


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.tree = tempfile.TemporaryDirectory(prefix="devpulse-recovery-")
        self.addCleanup(self.tree.cleanup)
        self.root = Path(self.tree.name)
        self.git("init", "--quiet")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "user.name", "Recovery Test")
        self.git("config", "core.autocrlf", "false")
        self.git("config", "core.hooksPath", str(self.root / "no-hooks"))

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.root, capture_output=True, check=True)

    def commit(self):
        self.git("add", "--all")
        self.git("commit", "--quiet", "-m", "fixture")

    def deleted(self):
        (self.root / "lost.rs").write_bytes(b"pub fn recovered() {}\n")
        self.commit()
        self.git("rm", "lost.rs")
        self.commit()

    def run_script(self, *args, success=True):
        result = subprocess.run([sys.executable, "-I", str(SCRIPT), *args],
                                cwd=self.root, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0 if success else 1, result.stdout + result.stderr)
        return result

    def test_committed_archive_does_not_erase_provenance_on_rerun(self):
        self.deleted()
        self.run_script()
        manifest = self.root / "recovered/repo/SOURCES.tsv"
        before = manifest.read_bytes()
        self.commit()
        self.run_script()
        self.assertEqual(manifest.read_bytes(), before)
        self.run_script("--check")

    def test_check_reports_missing_coverage_without_writing(self):
        self.deleted()
        result = self.run_script("--check", success=False)
        self.assertIn("unrecovered: 1", result.stdout)
        self.assertFalse((self.root / "recovered").exists())

    def test_modified_archive_is_never_overwritten(self):
        self.deleted()
        self.run_script()
        archived = self.root / "recovered/repo/lost.rs"
        manifest = archived.with_name("SOURCES.tsv").read_bytes()
        archived.write_bytes(b"user edit\n")
        self.run_script(success=False)
        self.assertEqual(archived.read_bytes(), b"user edit\n")
        self.assertEqual(archived.with_name("SOURCES.tsv").read_bytes(), manifest)

    def test_active_verbatim_copy_counts_but_archive_copy_does_not(self):
        self.deleted()
        (self.root / "active.rs").write_bytes(b"pub fn recovered() {}\n")
        self.commit()
        result = self.run_script("--check")
        self.assertIn("survive verbatim in active HEAD: 1", result.stdout)
        self.assertFalse((self.root / "recovered").exists())

    def test_later_deleted_revision_keeps_both_versions(self):
        self.deleted()
        self.run_script()
        self.commit()
        (self.root / "lost.rs").write_bytes(b"pub fn revised() {}\n")
        self.commit()
        self.git("rm", "lost.rs")
        self.commit()
        self.run_script()
        with (self.root / "recovered/repo/SOURCES.tsv").open(newline="", encoding="utf-8") as source:
            rows = list(csv.DictReader(source, delimiter="\t"))
        self.assertEqual(len(rows), 2)
        self.assertEqual({(self.root / "recovered/repo" / r["recovered_as"]).read_bytes()
                          for r in rows}, {b"pub fn recovered() {}\n", b"pub fn revised() {}\n"})
        self.run_script("--check")

    def test_supporting_sources_are_recovered_byte_for_byte(self):
        sources = {"config.json": b'{"keep":true}\n', "design.md": b"# Original design\n",
                   "page.html": b"<h1>Original</h1>\n", "launch.ps1": b"Write-Output ready\n",
                   "icon.png": bytes(range(256)), "schema.gbnf": b'root ::= "yes"\n',
                   "design.zip": b"PK\x03\x04preserve archive bytes", ".gitignore": b"output/\n",
                   "project.code-workspace": b'{"folders":[]}', "adapter.manifest": b"adapter"}
        for name, body in sources.items():
            (self.root / name).write_bytes(body)
        self.commit()
        self.git("rm", *sources)
        self.commit()
        self.run_script()
        for name, body in sources.items():
            self.assertEqual((self.root / "recovered/repo" / name).read_bytes(), body)
        self.run_script("--check")


if __name__ == "__main__":
    unittest.main()

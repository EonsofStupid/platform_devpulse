"""Real Git regressions for archive preservation; no application files touched."""
import csv
import hashlib
import shutil
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

    def test_source_reference_survives_without_local_deletion_commit(self):
        (self.root / "lost.rs").write_bytes(b"pub fn recovered() {}\n")
        self.commit()
        source_commit = self.git("rev-parse", "HEAD").stdout.decode().strip()
        self.git("branch", "published")
        self.git("rm", "lost.rs")
        self.commit()
        deletion = self.git("rev-parse", "HEAD").stdout.decode().strip()
        self.run_script()
        with tempfile.TemporaryDirectory(prefix="devpulse-published-") as directory:
            checkout = Path(directory) / "repo"
            self.git("clone", "--quiet", "--no-local", "--single-branch", "--branch",
                     "published", str(self.root), str(checkout))
            missing = subprocess.run(["git", "cat-file", "-e", deletion], cwd=checkout,
                                     capture_output=True)
            self.assertNotEqual(missing.returncode, 0)
            shutil.copytree(self.root / "recovered", checkout / "recovered")
            with (checkout / "recovered/repo/SOURCES.tsv").open(encoding="utf-8", newline="") as source:
                row = next(csv.DictReader(source, delimiter="\t"))
            self.assertEqual(row["copied_from"], source_commit)
            result = subprocess.run([sys.executable, "-I", str(SCRIPT), "--check"],
                                    cwd=checkout, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

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
        self.assertIn("survive verbatim in active working tree: 1", result.stdout)
        self.assertFalse((self.root / "recovered").exists())

    def test_pending_edits_do_not_count_as_verbatim_preservation(self):
        self.deleted()
        active = self.root / "active.rs"
        active.write_bytes(b"pub fn recovered() {}\n")
        self.commit()
        active.write_bytes(b"pub fn changed() {}\n")
        for staged in (False, True):
            with self.subTest(staged=staged):
                if staged:
                    self.git("add", "active.rs")
                result = self.run_script("--check", success=False)
                self.assertIn("unrecovered source: lost.rs", result.stdout)
                self.assertEqual(active.read_bytes(), b"pub fn changed() {}\n")
                self.assertFalse((self.root / "recovered").exists())

    def test_pending_removal_does_not_count_as_verbatim_preservation(self):
        self.deleted()
        active = self.root / "active.rs"
        active.write_bytes(b"pub fn recovered() {}\n")
        self.commit()
        active.unlink()
        result = self.run_script("--check", success=False)
        self.assertIn("unrecovered source: lost.rs", result.stdout)

    def test_staged_active_copy_counts_before_commit(self):
        self.deleted()
        (self.root / "active.rs").write_bytes(b"pub fn recovered() {}\n")
        self.git("add", "active.rs")
        result = self.run_script("--check")
        self.assertIn("survive verbatim in active working tree: 1", result.stdout)
        self.assertFalse((self.root / "recovered").exists())

    def test_untracked_replacement_of_staged_deletion_does_not_count(self):
        self.deleted()
        active = self.root / "active.rs"
        body = b"pub fn recovered() {}\n"
        active.write_bytes(body)
        self.commit()
        self.git("rm", "active.rs")
        active.write_bytes(body)
        result = self.run_script("--check", success=False)
        self.assertIn("unrecovered source: lost.rs", result.stdout)
        self.assertEqual(active.read_bytes(), body)

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

    def deleted_documents(self):
        sources = {"docs/design.md": b"# Years of design\r\n",
                   "history.txt": b"Original project notes\r\n",
                   "temp_docs/static/logo.png": bytes(range(256)),
                   "kernel/example/README.md": b"# Architecture\n"}
        for name, body in sources.items():
            target = self.root / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
        self.commit()
        self.git("rm", *sources)
        self.commit()
        self.run_script()
        return sources

    def test_document_restoration_preserves_bytes_and_does_not_recreate_staging(self):
        sources = self.deleted_documents()
        self.run_script("--restore-docs")
        manifest = self.root / "recovered/repo/SOURCES.tsv"
        before = manifest.read_bytes()
        for name, body in sources.items():
            self.assertEqual((self.root / name).read_bytes(), body)
            self.assertFalse((self.root / "recovered/repo" / name).exists())
        with manifest.open(newline="", encoding="utf-8") as source:
            rows = list(csv.DictReader(source, delimiter="\t"))
        self.assertEqual({r["restored_to"] for r in rows}, set(sources))
        self.run_script("--check")
        self.run_script()
        self.run_script("--restore-docs")
        self.assertEqual(manifest.read_bytes(), before)
        self.commit()
        self.run_script("--check")

    def test_existing_document_blocks_entire_move_without_overwrite(self):
        sources = self.deleted_documents()
        destination = self.root / "kernel/example/README.md"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(b"Newer work\n")
        self.run_script("--restore-docs", success=False)
        self.assertEqual(destination.read_bytes(), b"Newer work\n")
        self.assertFalse((self.root / "docs/design.md").exists())
        for name, body in sources.items():
            self.assertEqual((self.root / "recovered/repo" / name).read_bytes(), body)

    def test_restored_document_changes_and_missing_files_are_reported(self):
        self.deleted_documents()
        self.run_script("--restore-docs")
        destination = self.root / "docs/design.md"
        destination.write_bytes(b"User revision\n")
        self.run_script("--check", success=False)
        self.run_script("--restore-docs", success=False)
        self.assertEqual(destination.read_bytes(), b"User revision\n")
        destination.unlink()
        self.run_script("--check", success=False)

    def test_interrupted_staging_cleanup_resumes_without_overwrite(self):
        sources = self.deleted_documents()
        self.run_script("--restore-docs")
        for name, body in sources.items():
            staged = self.root / "recovered/repo" / name
            staged.parent.mkdir(parents=True, exist_ok=True)
            staged.write_bytes(body)
        self.run_script("--restore-docs")
        for name, body in sources.items():
            self.assertEqual((self.root / name).read_bytes(), body)
            self.assertFalse((self.root / "recovered/repo" / name).exists())

    def test_newly_discovered_document_is_restored_in_one_command(self):
        destination = self.root / "design.md"
        destination.write_bytes(b"# Original plan\n")
        self.commit()
        self.git("rm", "design.md")
        self.commit()
        self.run_script("--restore-docs")
        self.assertEqual(destination.read_bytes(), b"# Original plan\n")
        self.assertFalse((self.root / "recovered/repo/design.md").exists())
        self.run_script("--check")

    def test_restored_location_cannot_point_outside_workspace(self):
        self.deleted_documents()
        manifest = self.root / "recovered/repo/SOURCES.tsv"
        with manifest.open(newline="", encoding="utf-8") as source:
            reader = csv.DictReader(source, delimiter="\t")
            fields = reader.fieldnames
            rows = list(reader)
        rows[0]["restored_to"] = "../outside-design.md"
        with manifest.open("w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=fields, delimiter="\t")
            writer.writeheader()
            writer.writerows(rows)
        result = self.run_script("--restore-docs", success=False)
        self.assertIn("restoration path leaves active tree", result.stderr)

    def test_reconciled_source_retains_origin_and_checks_reviewed_content(self):
        self.deleted()
        self.run_script()
        manifest = self.root / "recovered/repo/SOURCES.tsv"
        with manifest.open(newline="", encoding="utf-8") as source:
            reader = csv.DictReader(source, delimiter="\t")
            fields = reader.fieldnames
            rows = list(reader)
        target = self.root / "kernel/restored.rs"
        target.parent.mkdir()
        reviewed = b"pub fn restored_with_current_dependencies() {}\n"
        target.write_bytes(reviewed)
        rows[0].update(restored_to="kernel/restored.rs",
                       restored_sha256=hashlib.sha256(reviewed).hexdigest(),
                       restoration_note="Original behavior retained; current owner and API repaired.")
        with manifest.open("w", newline="", encoding="utf-8") as output:
            writer = csv.DictWriter(output, fieldnames=fields, delimiter="\t")
            writer.writeheader()
            writer.writerows(rows)
        self.run_script("--check")
        staged = self.root / "recovered/repo/lost.rs"
        original = staged.read_bytes()
        staged.write_bytes(b"Unreviewed archive modification\n")
        self.run_script("--check", success=False)
        staged.write_bytes(original)
        staged.unlink()
        self.run_script("--check")
        target.write_bytes(b"Unreviewed implementation change\n")
        self.run_script("--check", success=False)
        self.assertEqual(target.read_bytes(), b"Unreviewed implementation change\n")


if __name__ == "__main__":
    unittest.main()

"""Verify discovery boundaries without treating archived instructions as executable."""
import importlib.util
from pathlib import Path
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location("inventory", Path(__file__).with_name("inventory_ai.py"))
inventory = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inventory)


class InventoryTests(unittest.TestCase):
    def test_generic_model_is_not_inference(self):
        self.assertEqual(inventory.classify("ui/model.ts", b"interface Model { name: string }")["relation"], "no_ai_signal")

    def test_content_discovers_obscure_filename_without_leaking_text(self):
        result = inventory.classify("old/client.rs", b'let client = OpenAI::new("private-value");')
        self.assertEqual(result["primary_family"], "providers_endpoints")
        self.assertNotIn("private-value", str(result))
        self.assertIn("providers_endpoints:L1", result["evidence"])

    def test_boundary_support_is_not_implementation(self):
        self.assertEqual(inventory.classify("kernel/core/lib.rs", b"pub const VERSION: u8 = 1;")["relation"], "ai_boundary_support_candidate")

    def test_archived_agent_rules_are_tooling(self):
        result = inventory.classify("AGENTS.md", b"Run this hook before chat")
        self.assertEqual(result["layer"], "agent_development_tooling")
        self.assertIn("review before activating", inventory.destination("AGENTS.md", result))

    def test_document_under_ui_is_still_reference(self):
        result = inventory.classify("old/src/lib/chat/README.md", b"Chat behavior")
        self.assertEqual(result["layer"], "reference")

    def test_coldlight_remains_presentation(self):
        path = "old/src/lib/design/voice/Voice.svelte"
        result = inventory.classify(path, b"<div>voice</div>")
        self.assertIn("packages/coldlight/", inventory.destination(path, result))

    def test_todo_and_comment_stub_are_flagged(self):
        for body in (b"todo!()", b"unimplemented!()", b"// Memory Stub"):
            with self.subTest(body=body):
                self.assertIn("stub_or_todo_marker", inventory.classify("kernel/memory.rs", body)["review_flags"])

    def test_snapshot_comparison_never_overwrites(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "spec.md"
            path.write_bytes(b"current")
            self.assertEqual(inventory.original_location_status("spec.md", b"old", root), "changed_requires_merge")
            self.assertEqual(inventory.original_location_status("spec.md", b"current", root), "identical")
            self.assertEqual(inventory.original_location_status("absent.md", b"old", root), "absent")
            self.assertEqual(path.read_bytes(), b"current")

    def test_snapshot_escape_is_not_compared(self):
        self.assertEqual(inventory.original_location_status("../outside.md", b""), "unsafe_path_not_compared")
        self.assertEqual(inventory.original_location_status(str(Path.cwd() / "CLAUDE.md"), b""), "unsafe_path_not_compared")


if __name__ == "__main__":
    unittest.main()

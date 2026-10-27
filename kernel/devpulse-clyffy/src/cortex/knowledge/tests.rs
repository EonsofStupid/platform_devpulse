//! Smoke tests for the knowledge library.
//!
//! Run with: `cargo test -p devpulse-clyffy knowledge_smoke`

#[cfg(test)]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod knowledge_smoke {
    use crate::cortex::knowledge::loader;
    use crate::cortex::knowledge::types::EntryType;
    use std::collections::HashSet;

    // ── Test 1: Manifest parses ─────────────────────────────

    #[test]
    fn manifest_parses_clean() {
        let manifest = loader::load_manifest().expect("manifest should parse");
        let parts: Vec<&str> = manifest.version.split('.').collect();
        assert!(
            parts.len() == 3 && parts.iter().all(|p| p.parse::<u32>().is_ok()),
            "manifest version {:?} is not major.minor.patch",
            manifest.version,
        );

        let names: Vec<&str> = manifest.files.iter().map(|f| f.name.as_str()).collect();
        for expected in [
            "did_you_know.json",
            "knowledge_drops.json",
            "frustrations.json",
            "insights.json",
            "glossary.json",
            "quizzes.json",
            "rearranges.json",
            "orderings.json",
        ] {
            assert!(names.contains(&expected), "manifest is missing {expected}");
        }
        assert_eq!(
            manifest.files.len(),
            8,
            "unexpected files in manifest: {names:?}"
        );
    }

    // ── Test 2: All entries parse ───────────────────────────

    #[test]
    fn all_entries_parse_clean() {
        let entries = loader::load_all().expect("load_all should succeed");
        let manifest = loader::load_manifest().expect("manifest should parse");
        let expected: usize = manifest.files.iter().map(|f| f.count).sum();
        assert_eq!(
            entries.len(),
            expected,
            "entry count must equal sum of manifest counts"
        );

        for entry in &entries {
            assert!(!entry.id.is_empty(), "entry id must not be empty");
            assert!(
                !entry.category.is_empty(),
                "entry category must not be empty"
            );
            assert!(
                !entry.added.is_empty(),
                "entry added date must not be empty"
            );
            assert!(!entry.tags.is_empty(), "entry must have at least one tag");
        }
    }

    // ── Test 3: Entry type matches id prefix ────────────────

    #[test]
    fn entry_type_matches_id_prefix() {
        let entries = loader::load_all().expect("load_all should succeed");

        for entry in &entries {
            let expected_prefix = match entry.entry_type {
                EntryType::Dyk => "dyk-",
                EntryType::Kdrop => "kdrop-",
                EntryType::Frust => "frust-",
                EntryType::Insight => "insight-",
                EntryType::Gloss => "gloss-",
                EntryType::Quiz => "quiz-",
                EntryType::Rank => "rank-",
                EntryType::Order => "order-",
            };
            assert!(
                entry.id.starts_with(expected_prefix),
                "entry {} should start with {} but doesn't",
                entry.id,
                expected_prefix,
            );
        }
    }

    // ── Test 4: No duplicate IDs ────────────────────────────

    #[test]
    fn no_duplicate_ids() {
        let entries = loader::load_all().expect("load_all should succeed");
        let mut seen = HashSet::new();

        for entry in &entries {
            assert!(seen.insert(&entry.id), "duplicate id found: {}", entry.id,);
        }
    }

    // ── Test 5: Content hash is stable ──────────────────────

    #[test]
    fn content_hash_is_stable_and_nonempty() {
        let entries = loader::load_all().expect("load_all should succeed");

        for entry in &entries {
            let hash1 = loader::content_hash(entry);
            let hash2 = loader::content_hash(entry);
            assert!(!hash1.is_empty(), "hash must not be empty for {}", entry.id);
            assert_eq!(hash1, hash2, "hash must be deterministic for {}", entry.id);
        }
    }

    // ── Test 6: Type counts are correct ─────────────────────

    #[test]
    fn type_counts_match_manifest() {
        // Counts come from `_manifest.json` so re-running the MD→JSON
        // converter (`pnpm knowledge:build`) doesn't break this test —
        // the manifest is regenerated in lockstep with the JSON files.
        let entries = loader::load_all().expect("load_all should succeed");
        let manifest = loader::load_manifest().expect("manifest should parse");

        let count_for = |name: &str| -> usize {
            manifest
                .files
                .iter()
                .find(|f| f.name == name)
                .map_or(0, |f| f.count)
        };
        let count_of =
            |t: EntryType| -> usize { entries.iter().filter(|e| e.entry_type == t).count() };

        assert_eq!(count_of(EntryType::Dyk), count_for("did_you_know.json"));
        assert_eq!(
            count_of(EntryType::Kdrop),
            count_for("knowledge_drops.json")
        );
        assert_eq!(count_of(EntryType::Frust), count_for("frustrations.json"));
        assert_eq!(count_of(EntryType::Insight), count_for("insights.json"));
        assert_eq!(count_of(EntryType::Gloss), count_for("glossary.json"));
    }

    // ── Test 7: Glossary entries have term+definition ────────

    #[test]
    fn glossary_entries_have_term_and_definition() {
        let entries = loader::load_all().expect("load_all should succeed");

        for entry in entries
            .iter()
            .filter(|e| matches!(e.entry_type, EntryType::Gloss))
        {
            assert!(
                entry.payload.get("term").and_then(|v| v.as_str()).is_some(),
                "glossary entry {} missing 'term' field",
                entry.id,
            );
            assert!(
                entry
                    .payload
                    .get("definition")
                    .and_then(|v| v.as_str())
                    .is_some(),
                "glossary entry {} missing 'definition' field",
                entry.id,
            );
        }
    }

    // ── Test 8: Text cards have title+body ──────────────────

    #[test]
    fn text_entries_have_title_and_body() {
        let entries = loader::load_all().expect("load_all should succeed");

        for entry in entries.iter().filter(|e| {
            matches!(
                e.entry_type,
                EntryType::Dyk | EntryType::Kdrop | EntryType::Frust | EntryType::Insight
            )
        }) {
            assert!(
                entry
                    .payload
                    .get("title")
                    .and_then(|v| v.as_str())
                    .is_some(),
                "entry {} missing 'title' field",
                entry.id,
            );
            assert!(
                entry.payload.get("body").and_then(|v| v.as_str()).is_some(),
                "entry {} missing 'body' field",
                entry.id,
            );
        }
    }

    // ── Test 9: Interactive entries carry their own fields ──

    #[test]
    fn interactive_entries_have_their_fields() {
        let entries = loader::load_all().expect("load_all should succeed");
        let text = |e: &crate::cortex::knowledge::types::KnowledgeEntry, key: &str| {
            e.payload.get(key).and_then(|v| v.as_str()).is_some()
        };
        let list = |e: &crate::cortex::knowledge::types::KnowledgeEntry, key: &str| {
            e.payload
                .get(key)
                .and_then(|v| v.as_array())
                .is_some_and(|a| !a.is_empty())
        };

        for entry in &entries {
            match entry.entry_type {
                EntryType::Quiz => {
                    assert!(
                        text(entry, "question"),
                        "quiz {} missing 'question'",
                        entry.id
                    );
                    assert!(
                        list(entry, "choices"),
                        "quiz {} missing 'choices'",
                        entry.id
                    );
                }
                EntryType::Rank => {
                    assert!(text(entry, "prompt"), "rank {} missing 'prompt'", entry.id);
                    assert!(list(entry, "items"), "rank {} missing 'items'", entry.id);
                }
                EntryType::Order => {
                    assert!(text(entry, "prompt"), "order {} missing 'prompt'", entry.id);
                    assert!(list(entry, "items"), "order {} missing 'items'", entry.id);
                    assert!(
                        list(entry, "correctOrderIds"),
                        "order {} missing 'correctOrderIds'",
                        entry.id,
                    );
                }
                _ => {}
            }
        }
    }
}

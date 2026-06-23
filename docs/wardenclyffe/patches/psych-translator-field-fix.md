# Fix: psych-translator reads `prompt`, not `user_prompt`

**Bug (confirmed by executing the hook):** Claude Code's `UserPromptSubmit` hook
delivers the message in the `prompt` field. `psych-translator.js` reads
`parsed.user_prompt`, which is always `undefined` in real sessions — so the CC-009
frustration-routing has never fired. (`banter-dump.js:63` already reads both fields
defensively; psych-translator did not.)

**Evidence:**
- `{"user_prompt":"what the hell is this"}` → fires (returns direct-mode context).
- `{"prompt":"what the hell is this"}` → returns `{}` (the real-world case).

**Fix** — one line. The agent self-modification guard blocks editing `.claude/`, so
run this yourself (verified exact-match, single occurrence):

```bash
sed -i "s/parsed.user_prompt || ''/parsed.prompt || parsed.user_prompt || ''/" .claude/hooks/psych-translator.js
```

Result (line 11):
```js
const message = parsed.prompt || parsed.user_prompt || '';
```

**Verify after applying:**
```bash
echo '{"prompt":"what the hell is this"}' | node .claude/hooks/psych-translator.js
# expect: {"additionalContext":"USER SIGNAL: High urgency. ..."}
```

Or grant `Edit(.claude/**)` (add `{"permissions":{"allow":["Edit(.claude/**)"]}}`
to `.claude/settings.local.json`) and I'll apply + re-verify it.

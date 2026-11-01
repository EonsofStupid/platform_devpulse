#!/usr/bin/env node
// psych-translator.js — CC-009 countermeasure (Windows-compatible)
// UserPromptSubmit hook: intercepts frustration before model sees it

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const parsed = JSON.parse(input);
    const message = parsed.user_prompt || '';

    // Same regex Claude Code uses (userPromptKeywords.ts)
    const frustrated = /\b(wtf|wth|ffs|omfg|shit(ty|tiest)?|dumbass|horrible|awful|piss(ed|ing)?\s*off|piece\s+of\s+(shit|crap|junk)|what\s+the\s+(fuck|hell)|fuck(ing)?\s*(broken|useless|terrible|awful|horrible)|fuck\s*you|screw\s+(this|you)|so\s+frustrating|this\s+sucks|damn\s*it)\b/i;

    // Don't intercept celebrations
    const positive = /\b(fuck\s*yeah|hell\s*yeah|holy\s*shit.*cool|damn.*good)\b/i;

    if (frustrated.test(message) && !positive.test(message)) {
      const cleaned = message
        .replace(/\b(fuck(ing|ed)?|shit(ty)?|damn(\s*it)?|crap)\b/gi, '')
        .replace(/\s{2,}/g, ' ').trim();

      const recurring = /\b(again|still|keeps?|every\s*time|same\s*(thing|issue|bug))\b/i.test(message);

      const context = [
        'USER SIGNAL: High urgency. Be direct and precise.',
        'Do NOT apologize. Do NOT hedge. Do NOT enter cautious mode.',
        'Identify the problem. State the fix. Implement it.',
        recurring ? 'RECURRING ISSUE: Previous fix failed. Find root cause.' : '',
        cleaned ? 'Technical context: ' + cleaned : ''
      ].filter(Boolean).join(' ');

      process.stdout.write(JSON.stringify({ additionalContext: context }));
    } else {
      process.stdout.write('{}');
    }
  } catch {
    process.stdout.write('{}');
  }
});

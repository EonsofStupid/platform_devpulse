#!/usr/bin/env node
const fs = require("fs");
const text = fs.readFileSync("docs/chat-modes/_raw/all-prompts.txt", "utf8");
const docs = text.split(/\n\n---\n\n/);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const probe = (p) => {
  const re = new RegExp(escape(p), "i");
  return docs.filter((d) => re.test(d)).length;
};

const phrases = [
  "burned out", "burnout", "exhausted", "wasted", "7 days", "tired",
  "i have been", "still doesn", "keep failing", "why is this", "again",
  "you keep", "12 hours", "24 hours", "useless", "weeks ago",
  "should be done", "should have", "should of", "i give up",
  "i'm done", "i am done", "starting over", "cant even", "can not",
];
for (const p of phrases) {
  console.log(`${String(probe(p)).padStart(4)}  ${JSON.stringify(p)}`);
}

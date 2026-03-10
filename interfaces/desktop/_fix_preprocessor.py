"""Fix the classifyPreprocessor in sd.config.mjs to use token.filePath instead of dictionary keys."""
import re

path = "src/lib/design/config/coldlight/styledictionary/sd.config.mjs"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Find and replace the preprocessor section
# Match from the comment block through the closing brace of classifyPreprocessor
old_pattern = r'// ─── Auto-Classification Preprocessor ───.*?function classifyPreprocessor\(dictionary\) \{.*?\n\treturn dictionary;\n\}'

new_code = """// ─── Auto-Classification Preprocessor ───
// Walks the merged token tree. Each leaf token has .filePath set by SD5 combineJSON.
// Classification is determined SOLELY by source filename:
//   primitive.json → "primitive"
//   semantic.json  → "semantic"
//   composite.json → "composite"

function tierFromPath(filePath) {
\tif (!filePath) return "primitive";
\tif (filePath.includes("/primitive.json") || filePath.includes("\\\\primitive.json")) return "primitive";
\tif (filePath.includes("/semantic.json") || filePath.includes("\\\\semantic.json")) return "semantic";
\tif (filePath.includes("/composite.json") || filePath.includes("\\\\composite.json")) return "composite";
\treturn "primitive";
}

function classifyPreprocessor(dictionary) {
\tfunction walk(obj) {
\t\tif (obj === null || typeof obj !== "object") return;

\t\tfor (const [key, node] of Object.entries(obj)) {
\t\t\tif (key.startsWith("$")) continue;
\t\t\tif (typeof node !== "object" || node === null) continue;

\t\t\tif ("$value" in node) {
\t\t\t\t// SD5 sets .filePath on each leaf token during combineJSON (before preprocessors)
\t\t\t\tconst tier = tierFromPath(node.filePath);
\t\t\t\tif (!node.$extensions) node.$extensions = {};
\t\t\t\tif (!node.$extensions["com.coldlight"]) node.$extensions["com.coldlight"] = {};
\t\t\t\tnode.$extensions["com.coldlight"].tier = tier;
\t\t\t} else {
\t\t\t\twalk(node);
\t\t\t}
\t\t}
\t}

\twalk(dictionary);
\treturn dictionary;
}"""

result = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

if result == content:
    print("ERROR: Pattern not found!")
    # Debug: show what's around line 121
    lines = content.split('\n')
    for i in range(120, min(165, len(lines))):
        print(f"{i+1}: {lines[i]}")
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(result)
    print("SUCCESS: Preprocessor replaced")

---
name: scan-project
description: Deep scan of codebase structure, tech debt, and architecture
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, Bash
argument-hint: "[area to focus on]"
---

# Project Scanner

Perform a thorough scan of the codebase. If an area is specified, focus there: $ARGUMENTS

## Steps

1. Map the directory structure (top 3 levels)
2. Identify key entry points and configuration files
3. Check for:
   - TODO/FIXME/HACK comments
   - Dead code or unused exports
   - Missing tests for critical paths
   - Dependency health (outdated, vulnerable)
4. Report findings in a structured format with file:line references
5. Prioritize issues by severity

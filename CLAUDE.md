# agent-json (npm package)

CLI tool for generating and validating agent.json files. Published on npm as `agent-json`.

## Ecosystem

| Repo | Role |
|------|------|
| spec | Source of truth — the specification |
| agentwebprotocol.org | Standards website |
| agent-json.org | Schema reference and validator site |
| **agent.json** (this repo) | npm CLI package |
| mcp-server | MCP server for Claude Code |

GitHub org: github.com/agentwebprotocol

## Usage

```bash
npx agent-json init          # Interactive generator
npx agent-json init --dry-run # Preview without writing
npx agent-json validate file  # Validate a file
```

## Key Files

- `src/cli.js` — CLI entry point (#!/usr/bin/env node)
- `src/index.js` — Programmatic API (generate, validate)
- `src/schema.js` — Validation logic
- `package.json` — npm package config (name: agent-json, v0.1.0)

## Design Decisions

- Zero external dependencies — only Node.js builtins (readline, fs, path)
- This is intentional: makes `npx` instant, reduces supply chain risk, builds trust

## Publishing

```bash
npm version patch  # bump version
npm publish        # publish to npm
```

npm account: bshyong158. Auth token in 1Password (Clawdbot vault, "Npmjs" item).

## When Spec Changes

Update `src/schema.js` with new required/optional fields, then bump version and publish.

#!/usr/bin/env node

/**
 * agent-json CLI
 *
 * Commands:
 *   init               Interactive scaffolding for agent.json
 *     --dry-run         Print JSON to stdout without writing a file
 *   validate <file>     Validate an agent.json file
 */

import { createInterface } from 'readline';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { generate, validate } from './index.js';

// ── Helpers ──────────────────────────────────────────────────────────

function ask(rl, question) {
  return new Promise((res) => rl.question(question, res));
}

function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function red(s) { return `\x1b[31m${s}\x1b[0m`; }
function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s) { return `\x1b[2m${s}\x1b[0m`; }

function detectDomain() {
  try {
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    if (pkg.homepage) {
      return new URL(pkg.homepage).hostname;
    }
  } catch { /* ignore */ }
  return '';
}

// ── init (dry-run) ───────────────────────────────────────────────────

function dryRunInit() {
  const doc = generate({
    domain: detectDomain() || 'example.com',
    intent: 'Describe your service here',
    actions: [
      {
        id: 'example_action',
        description: 'An example action',
        auth_required: false,
        endpoint: '/api/example',
        method: 'GET'
      }
    ]
  });
  console.log(JSON.stringify(doc, null, 2));
}

// ── init (interactive) ──────────────────────────────────────────────

async function interactiveInit() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(bold('\nagent-json init\n'));
  console.log(dim('Generate an agent.json file for your project.\n'));

  const defaultDomain = detectDomain() || 'example.com';
  const domain = (await ask(rl, `Domain ${dim(`(${defaultDomain})`)}: `)).trim() || defaultDomain;
  const intent = (await ask(rl, 'Intent (one sentence): ')).trim() || 'Describe your service here';
  const authType = (await ask(rl, `Auth type ${dim('(none/api_key/oauth2/bearer)')} [none]: `)).trim() || 'none';

  const actions = [];
  let addMore = true;

  console.log(dim('\nAdd actions (leave id blank to finish):\n'));

  while (addMore) {
    const id = (await ask(rl, '  Action id: ')).trim();
    if (!id) { addMore = false; break; }

    const method = (await ask(rl, `  HTTP method ${dim('[GET]')}: `)).trim().toUpperCase() || 'GET';
    const endpoint = (await ask(rl, '  Endpoint: ')).trim() || `/api/${id}`;
    const description = (await ask(rl, '  Description: ')).trim() || '';
    const authReq = (await ask(rl, `  Auth required? ${dim('[n]')}: `)).trim().toLowerCase();

    const action = { id, method, endpoint };
    if (description) action.description = description;
    action.auth_required = authReq === 'y' || authReq === 'yes';

    actions.push(action);
    console.log(green(`  + Added "${id}"\n`));
  }

  const doc = generate({ domain, intent, authType, actions });

  // Ask where to write
  const location = (await ask(rl, `\nWrite to ${dim('(1) .well-known/agent.json  (2) ./agent.json')} [1]: `)).trim();

  const filePath = location === '2'
    ? resolve('agent.json')
    : resolve('.well-known', 'agent.json');

  rl.close();

  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const json = JSON.stringify(doc, null, 2) + '\n';
  writeFileSync(filePath, json, 'utf8');
  console.log(green(`\nWrote ${filePath}\n`));
}

// ── validate ─────────────────────────────────────────────────────────

async function validateFile(pathOrUrl) {
  const isUrl = /^https?:\/\//i.test(pathOrUrl);
  const source = isUrl ? pathOrUrl : resolve(pathOrUrl);

  let raw;
  if (isUrl) {
    try {
      const res = await fetch(pathOrUrl, {
        headers: { Accept: 'application/json' },
        redirect: 'follow',
      });
      if (!res.ok) {
        console.error(red(`Cannot fetch ${pathOrUrl}: HTTP ${res.status}`));
        process.exit(1);
      }
      raw = await res.text();
    } catch (err) {
      console.error(red(`Cannot fetch ${pathOrUrl}: ${err.message}`));
      process.exit(1);
    }
  } else {
    try {
      raw = readFileSync(source, 'utf8');
    } catch (err) {
      console.error(red(`Cannot read file: ${source}`));
      process.exit(1);
    }
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(red('Invalid JSON: ' + err.message));
    process.exit(1);
  }

  const result = validate(data);

  console.log(bold(`\nValidating: ${source}\n`));

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(green('  \u2713 Valid agent.json — no issues found.\n'));
    return;
  }

  for (const e of result.errors) {
    console.log(red(`  \u2717 ${e}`));
  }
  for (const w of result.warnings) {
    console.log(`  \u26A0 ${w}`);
  }

  console.log('');

  if (!result.valid) {
    console.log(red(`  ${result.errors.length} error(s) found.\n`));
    process.exit(1);
  } else {
    console.log(green('  \u2713 Valid') + ` with ${result.warnings.length} warning(s).\n`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (command === 'init') {
  if (args.includes('--dry-run')) {
    dryRunInit();
  } else {
    interactiveInit().catch((err) => {
      console.error(red(err.message));
      process.exit(1);
    });
  }
} else if (command === 'validate') {
  const file = args[1];
  if (!file) {
    console.error(red('Usage: agent-json validate <file>'));
    process.exit(1);
  }
  validateFile(file);
} else {
  console.log(`
${bold('agent-json')} — CLI for the Agent Web Protocol

${bold('Usage:')}
  agent-json init              Generate an agent.json interactively
  agent-json init --dry-run    Print a sample agent.json to stdout
  agent-json validate <file-or-url>  Validate an agent.json file or remote URL

${dim('https://agentwebprotocol.org')}
`);
}

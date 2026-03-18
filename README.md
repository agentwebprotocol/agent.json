# agent.json

**The file format for declaring website capabilities to AI agents.**

## Quick Start

Generate an agent.json for your project:

```bash
npx agent-json init
```

Validate an existing file:

```bash
npx agent-json validate agent.json
```

---

Part of the [Agent Web Protocol](https://agentwebprotocol.org) standard. Add an `agent.json` file to your site and AI agents can discover what actions are available, how to authenticate, and how to recover from errors.

---

## Minimal Example
```json
{
  "awp_version": "0.1",
  "domain": "example.com",
  "intent": "e-commerce platform",
  "actions": [
    {
      "id": "search_products",
      "description": "Search the product catalog",
      "auth_required": false,
      "inputs": {
        "query": { "type": "string", "required": true }
      },
      "outputs": {
        "products": "array[product]"
      },
      "endpoint": "/api/products/search",
      "method": "GET"
    }
  ],
  "errors": {
    "RATE_LIMITED": {
      "recovery": "wait 60 seconds then retry"
    }
  }
}
```

---

## Full Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `awp_version` | string | yes | Spec version (e.g. `"0.1"`) |
| `domain` | string | yes | Canonical domain |
| `intent` | string | yes | Plain language description of the surface |
| `capabilities` | object | no | Feature flags |
| `auth` | object | no | Auth type, expiry, refresh endpoint |
| `entities` | object | no | Typed data models referenced by actions |
| `actions` | array | yes | Declared actions with inputs, outputs, endpoints |
| `errors` | object | no | Error codes mapped to recovery instructions |
| `dependencies` | object | no | Action prerequisite graph |
| `agent_hints` | object | no | Semantic guidance for agent planning |
| `agent_status` | object | no | Liveness signal |

---

## Why Recovery Contracts Matter

Every error in agent.json includes a machine-readable recovery instruction:
```json
"errors": {
  "AUTH_EXPIRED": {
    "recovery": "call /api/auth/refresh then retry original action"
  },
  "SEAT_UNAVAILABLE": {
    "recovery": "retry search_flights with different parameters"
  }
}
```

This is the core innovation. Agents don't just know what to do —
they know what to do when things go wrong.

---

## Sensitivity Declaration

Actions that have real-world consequences declare it explicitly:
```json
{
  "id": "delete_account",
  "sensitivity": "irreversible",
  "requires_human_confirmation": true,
  "reversible": false
}
```

This gives AI platforms a standardized signal for when to prompt 
human confirmation before proceeding.

---

## Publish Your Own

1. Create `agent.json` at the root of your domain
2. Declare your actions, auth contract, and error recovery
3. Agents will discover it automatically at `yourdomain.com/agent.json`

→ [Full specification](https://github.com/agentwebprotocol/spec)  
→ [Validate your file](https://agent-json.org/validate)  
→ [Examples by industry](https://agent-json.org/examples)

---

## Can't publish natively?

Synthetic agent.json generation tools can bridge the gap for sites that haven't implemented the standard yet. See agentwebprotocol.org for more.

---

## Part of Agent Web Protocol

agent.json is the file format defined by [Agent Web Protocol](https://agentwebprotocol.org) —
the open standard for declaring any web surface as agent-ready.

Licensed MIT — use freely, contribute openly.  
Contact: spec@agentwebprotocol.org

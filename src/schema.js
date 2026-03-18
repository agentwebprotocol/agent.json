/**
 * agent.json schema validation logic.
 * No external dependencies — pure Node.js.
 */

const REQUIRED_TOP_LEVEL = ['awp_version', 'domain', 'intent', 'actions'];

const REQUIRED_ACTION_FIELDS = ['id', 'method', 'endpoint'];

const VALID_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const VALID_AUTH_TYPES = ['none', 'api_key', 'oauth2', 'bearer'];

/**
 * Validate an agent.json object.
 * @param {object} data - Parsed agent.json content
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validate(data) {
  const errors = [];
  const warnings = [];

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('Root must be a JSON object');
    return { valid: false, errors, warnings };
  }

  // Check required top-level fields
  for (const field of REQUIRED_TOP_LEVEL) {
    if (!(field in data)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Type checks for present fields
  if ('awp_version' in data && typeof data.awp_version !== 'string') {
    errors.push('"awp_version" must be a string');
  }

  if ('domain' in data && typeof data.domain !== 'string') {
    errors.push('"domain" must be a string');
  }

  if ('intent' in data && typeof data.intent !== 'string') {
    errors.push('"intent" must be a string');
  }

  // Validate actions array
  if ('actions' in data) {
    if (!Array.isArray(data.actions)) {
      errors.push('"actions" must be an array');
    } else {
      if (data.actions.length === 0) {
        warnings.push('"actions" array is empty — consider adding at least one action');
      }

      const seenIds = new Set();

      data.actions.forEach((action, i) => {
        const prefix = `actions[${i}]`;

        if (typeof action !== 'object' || action === null) {
          errors.push(`${prefix}: must be an object`);
          return;
        }

        for (const field of REQUIRED_ACTION_FIELDS) {
          if (!(field in action)) {
            errors.push(`${prefix}: missing required field "${field}"`);
          }
        }

        if ('id' in action) {
          if (typeof action.id !== 'string') {
            errors.push(`${prefix}: "id" must be a string`);
          } else if (seenIds.has(action.id)) {
            errors.push(`${prefix}: duplicate action id "${action.id}"`);
          } else {
            seenIds.add(action.id);
          }
        }

        if ('method' in action) {
          if (typeof action.method !== 'string') {
            errors.push(`${prefix}: "method" must be a string`);
          } else if (!VALID_METHODS.includes(action.method.toUpperCase())) {
            warnings.push(`${prefix}: unusual HTTP method "${action.method}"`);
          }
        }

        if ('endpoint' in action && typeof action.endpoint !== 'string') {
          errors.push(`${prefix}: "endpoint" must be a string`);
        }

        if ('description' in action && typeof action.description !== 'string') {
          errors.push(`${prefix}: "description" must be a string`);
        }

        if ('auth_required' in action && typeof action.auth_required !== 'boolean') {
          errors.push(`${prefix}: "auth_required" must be a boolean`);
        }
      });
    }
  }

  // Validate auth if present
  if ('auth' in data && data.auth !== null) {
    if (typeof data.auth !== 'object' || Array.isArray(data.auth)) {
      errors.push('"auth" must be an object');
    } else if ('type' in data.auth) {
      if (!VALID_AUTH_TYPES.includes(data.auth.type)) {
        warnings.push(`Unknown auth type "${data.auth.type}" — expected one of: ${VALID_AUTH_TYPES.join(', ')}`);
      }
    }
  }

  // Validate errors map if present
  if ('errors' in data && data.errors !== null) {
    if (typeof data.errors !== 'object' || Array.isArray(data.errors)) {
      errors.push('"errors" must be an object');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export { REQUIRED_TOP_LEVEL, REQUIRED_ACTION_FIELDS, VALID_METHODS, VALID_AUTH_TYPES };

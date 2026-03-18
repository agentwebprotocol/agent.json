/**
 * agent-json — programmatic API
 *
 * Generate and validate agent.json files for the Agent Web Protocol.
 */

import { validate } from './schema.js';

/**
 * Generate an agent.json object from the given options.
 *
 * @param {object} opts
 * @param {string} opts.domain - Canonical domain
 * @param {string} opts.intent - One-sentence description
 * @param {string} [opts.awpVersion='0.1'] - Spec version
 * @param {string} [opts.authType] - Auth type (none, api_key, oauth2, bearer)
 * @param {Array<object>} [opts.actions=[]] - Array of action objects
 * @returns {object} A valid agent.json object
 */
export function generate({
  domain,
  intent,
  awpVersion = '0.1',
  authType,
  actions = []
} = {}) {
  const result = {
    awp_version: awpVersion,
    domain: domain || 'example.com',
    intent: intent || 'Describe your service here',
    actions
  };

  if (authType && authType !== 'none') {
    result.auth = { type: authType };
  }

  return result;
}

export { validate };

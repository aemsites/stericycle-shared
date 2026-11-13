import ffetch from './ffetch.js';

/**
 * Location of the eCommerce flow spreadsheet (published as JSON at the site root).
 * Kept as a single constant so it is easy to relocate.
 */
export const ECOMMERCE_FLOW_SHEET = '/ecommerce-flow.json';

/**
 * Normalize a label for case/space/hyphen insensitive comparison.
 * e.g. 'ProtectPLUS' -> 'protectplus', 'Drop-off' -> 'dropoff', 'by service type' -> 'byservicetype'
 * @param {*} value
 * @returns {string}
 */
export const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Whether a spreadsheet/config value reads as an affirmative toggle.
 * @param {*} value
 * @returns {boolean}
 */
export const isYes = (value) => ['yes', 'true'].includes(normalize(value));

/**
 * Resolve which spreadsheet column applies to the current host.
 * - www.shredit.com                 -> prod
 * - stage.* on shredit.com         -> stage
 * - anything else (localhost, *.aem.page, *.aem.live, dev.*) -> dev
 * @returns {'dev'|'stage'|'prod'}
 */
export function getFlowEnvironment() {
  const { hostname } = window.location;
  if (hostname === 'www.shredit.com') return 'prod';
  if (hostname.endsWith('.shredit.com') && hostname.startsWith('stage')) return 'stage';
  return 'dev';
}

/**
 * Fetch the eCommerce flow spreadsheet and reduce it to a { normalizedProperty: value } map
 * for the current environment. Each row is a property (e.g. `enabled`, `encryption-key`,
 * a flow name) and each environment has its own column (`dev`, `stage`, `prod`):
 *
 *   | Property       | dev   | stage | prod  |
 *   | enabled        | yes   | yes   | no    |
 *   | encryption-key | ...   | ...   | ...   |
 *   | drop off       | https | https | https |
 *
 * The property column is read tolerantly (Property/Flow/Key, any casing), as are the
 * environment column headers. Returns {} on any failure so callers fall back.
 * @param {string} [env] environment column to read; defaults to the current host's environment
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchFlows(env = getFlowEnvironment()) {
  try {
    const rows = await ffetch(ECOMMERCE_FLOW_SHEET).all();
    const column = normalize(env);
    return rows.reduce((map, row) => {
      const cells = Object.fromEntries(Object.entries(row).map(([k, v]) => [normalize(k), v]));
      const key = normalize(cells.property ?? cells.flow ?? cells.key ?? '');
      const value = cells[column] ?? '';
      if (key) {
        map[key] = typeof value === 'string' ? value.trim() : value;
      }
      return map;
    }, {});
  } catch {
    return {};
  }
}

/**
 * Resolve a single flow's destination URL, honoring the global `enabled` toggle.
 * Returns null when the flow feature is disabled or the flow key is not configured.
 * @param {string} flowKey the flow label to look up (e.g. 'drop off')
 * @returns {Promise<string|null>}
 */
export async function resolveFlowUrl(flowKey) {
  const map = await fetchFlows();
  if (!isYes(map.enabled)) return null;
  return map[normalize(flowKey)] || null;
}

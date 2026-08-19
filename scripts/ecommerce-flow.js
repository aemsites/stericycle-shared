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
 * Fetch the eCommerce flow spreadsheet and reduce it to a { normalizedFlow: url } map.
 * The `enabled` row acts as the global on/off toggle. Column headers are read tolerantly
 * (Flow/Key and Url/Value, any casing). Returns {} on any failure so callers fall back.
 * @returns {Promise<Record<string, string>>}
 */
export async function fetchFlows() {
  try {
    const rows = await ffetch(ECOMMERCE_FLOW_SHEET).all();
    return rows.reduce((map, row) => {
      const key = normalize(row.Flow ?? row.flow ?? row.Key ?? row.key ?? '');
      const value = row.Url ?? row.url ?? row.URL ?? row.Value ?? row.value ?? '';
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

import ffetch from '../../scripts/ffetch.js';

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
const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');

/**
 * Whether a spreadsheet/config value reads as an affirmative toggle.
 * @param {*} value
 * @returns {boolean}
 */
const isYes = (value) => ['yes', 'true'].includes(normalize(value));

/**
 * Fetch the eCommerce flow spreadsheet and reduce it to a { normalizedFlow: url } map.
 * The `enabled` row acts as the global on/off toggle. Column headers are read tolerantly
 * (Flow/Key and Url/Value, any casing). Returns {} on any failure so callers fall back.
 * @returns {Promise<Record<string, string>>}
 */
async function fetchFlows() {
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
 * Read the value of a named form control (checked value for radio/checkbox groups).
 * @param {HTMLFormElement} form
 * @param {string} name
 * @returns {string}
 */
function getFieldValue(form, name) {
  let value = '';
  form.querySelectorAll(`[name='${name}']`).forEach((el) => {
    if (el.type === 'radio' || el.type === 'checkbox') {
      if (el.checked) value = el.value;
    } else if (el.value) {
      value = el.value;
    }
  });
  return value;
}

/**
 * Resolve the destination URL for a form's flow from the spreadsheet map.
 * For 'by service type' the URL depends on the `serviceType1` field value:
 * one time -> Purge URL, ongoing -> ProtectPLUS URL.
 * @param {HTMLFormElement} form
 * @param {string} flowType the block's `eCommerce Flow` value
 * @param {Record<string, string>} map
 * @returns {string|null}
 */
function resolveBaseUrl(form, flowType, map) {
  const flow = normalize(flowType);
  if (flow === 'byservicetype') {
    const serviceType = normalize(getFieldValue(form, 'serviceType1'));
    if (serviceType === 'purge') return map.purge || null;
    if (serviceType === 'regular') return map.protectplus || null;
    return null;
  }
  return map[flow] || null;
}

/**
 * Collect every non-empty user field as query params (field name = param key).
 * Buttons, fieldsets, disabled controls and unchecked radios/checkboxes are skipped.
 * @param {HTMLFormElement} form
 * @returns {URLSearchParams}
 */
function buildQueryParams(form) {
  const params = new URLSearchParams();
  [...form.elements].forEach((fe) => {
    if (!fe.name || fe.disabled || fe.matches('button') || fe.tagName === 'FIELDSET') return;
    if ((fe.type === 'radio' || fe.type === 'checkbox') && !fe.checked) return;
    const { value } = fe;
    if (value != null && `${value}`.trim() !== '') {
      params.append(fe.name, value);
    }
  });
  return params;
}

/**
 * Resolve the full eCommerce redirect URL for a submitted form, or null when the
 * current (POST) behaviour should be used instead. Returns null when the form is not
 * eCommerce-enabled, the global toggle is off, or no URL could be resolved.
 * @param {HTMLFormElement} form
 * @returns {Promise<string|null>}
 */
export async function resolveEcommerceRedirectUrl(form) {
  if (!isYes(form.dataset.ecommerceEnable)) return null;
  const map = await fetchFlows();
  if (!isYes(map.enabled)) return null;
  const baseUrl = resolveBaseUrl(form, form.dataset.ecommerceFlow, map);
  if (!baseUrl) return null;
  const query = buildQueryParams(form).toString();
  if (!query) return baseUrl;
  return baseUrl.includes('?') ? `${baseUrl}&${query}` : `${baseUrl}?${query}`;
}

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
 * Collect every non-empty user field into a plain object (field name -> value).
 * Buttons, fieldsets, disabled controls and unchecked radios/checkboxes are skipped.
 * Repeated names (e.g. checkbox groups) collapse into an array.
 * @param {HTMLFormElement} form
 * @returns {Record<string, string|string[]>}
 */
function collectFormData(form) {
  const data = {};
  [...form.elements].forEach((fe) => {
    if (!fe.name || fe.disabled || fe.matches('button') || fe.tagName === 'FIELDSET') return;
    if ((fe.type === 'radio' || fe.type === 'checkbox') && !fe.checked) return;
    const { value } = fe;
    if (value == null || `${value}`.trim() === '') return;
    if (Object.prototype.hasOwnProperty.call(data, fe.name)) {
      data[fe.name] = [].concat(data[fe.name], value);
    } else {
      data[fe.name] = value;
    }
  });
  return data;
}

/**
 * Decode a hex string (optionally 0x-prefixed) into bytes. Throws on invalid input.
 * @param {string} hex
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
  const clean = String(hex).trim().replace(/^0x/i, '');
  if (clean.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(clean)) {
    throw new Error('invalid hex key');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Encode bytes as URL-safe base64 without padding (safe to drop straight into a query value).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64Url(bytes) {
  let binary = '';
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Encrypt a plaintext string with AES-256-GCM using a 32-byte hex key.
 * Envelope layout: base64url( IV[12 bytes] + ciphertext + GCM auth tag[16 bytes] ) — the
 * form a SubtleCrypto/Web Crypto receiver decrypts directly (Web Crypto appends the tag).
 * Requires a secure context (https/localhost), which EDS pages always are.
 * @param {string} plaintext
 * @param {string} hexKey 64-char (32-byte) hex string
 * @returns {Promise<string>}
 */
async function encryptAesGcm(plaintext, hexKey) {
  const keyBytes = hexToBytes(hexKey);
  if (keyBytes.length !== 32) {
    throw new Error('AES-256 requires a 32-byte (64 hex char) key');
  }
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintextBytes),
  );
  const envelope = new Uint8Array(iv.length + cipher.length);
  envelope.set(iv, 0);
  envelope.set(cipher, iv.length);
  return bytesToBase64Url(envelope);
}

/**
 * Resolve the full eCommerce redirect URL for a submitted form, or null when the
 * current (POST) behaviour should be used instead. The form data is serialized to JSON,
 * encrypted with AES-256-GCM (hex key from the sheet's `encryption-key` row) and passed as a
 * single `data` query param. Returns null when the form is not eCommerce-enabled, the global
 * toggle is off, no URL resolves, the key is missing/invalid, or encryption fails.
 * @param {HTMLFormElement} form
 * @returns {Promise<string|null>}
 */
export async function resolveEcommerceRedirectUrl(form) {
  if (!isYes(form.dataset.ecommerceEnable)) return null;
  const map = await fetchFlows();
  if (!isYes(map.enabled)) return null;
  const baseUrl = resolveBaseUrl(form, form.dataset.ecommerceFlow, map);
  if (!baseUrl) return null;
  const hexKey = map.encryptionkey;
  if (!hexKey) return null;
  try {
    const json = JSON.stringify(collectFormData(form));
    const data = await encryptAesGcm(json, hexKey);
    const param = `data=${data}`;
    return baseUrl.includes('?') ? `${baseUrl}&${param}` : `${baseUrl}?${param}`;
  } catch {
    // missing/invalid key or crypto failure -> fall back to the normal POST behaviour
    return null;
  }
}

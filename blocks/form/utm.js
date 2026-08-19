import { fetchPlaceholders } from '../../scripts/aem.js';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const COOKIE_TTL_MS = 30 * 60 * 1000;

const readCookie = (name) => {
  const entry = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return entry ? entry.split('=')[1] : null;
};

const writeCookie = (name, value) => {
  const expires = new Date(Date.now() + COOKIE_TTL_MS).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}`;
};

/**
 * Resolve the active UTM parameters as a plain { key: value } object.
 * Values are sourced (in priority order) from the current URL, a 30-minute cookie, and
 * finally the referrer host when it matches a known utm-source placeholder. Any value
 * found in the URL or via the referrer is persisted to a cookie so it survives navigation.
 * @returns {Promise<Record<string, string>>}
 */
export async function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};

  UTM_KEYS.forEach((key) => {
    const urlVal = params.get(key);
    if (urlVal) {
      result[key] = urlVal;
      writeCookie(key, urlVal);
    }
  });

  UTM_KEYS.forEach((key) => {
    if (!result[key]) {
      const cookieVal = readCookie(key);
      if (cookieVal) result[key] = cookieVal;
    }
  });

  if (!result.utm_source || !result.utm_medium) {
    try {
      const referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
      if (referrerHost) {
        const ph = await fetchPlaceholders('/forms/utm-sources');
        const sources = ph ? Object.values(ph) : [];
        if (sources.includes(referrerHost)) {
          if (!result.utm_source) {
            result.utm_source = referrerHost;
            writeCookie('utm_source', referrerHost);
          }
          if (!result.utm_medium) {
            result.utm_medium = 'organic';
            writeCookie('utm_medium', 'organic');
          }
        }
      }
    } catch {
      /* empty */
    }
  }

  return result;
}

const createUtmInput = (name, value, form) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
};

/**
 * Append the resolved UTM parameters as hidden inputs to a form so they are submitted.
 * @param {HTMLFormElement} form
 */
export default async function decorateUTM(form) {
  const utmParams = await getUtmParams();
  Object.entries(utmParams).forEach(([name, value]) => createUtmInput(name, value, form));
}

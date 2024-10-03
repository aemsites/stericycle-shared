// eslint-disable-next-line import/no-unresolved
import { fetchPlaceholders } from '../../../../../../../scripts/aem.js';

const createUtmInput = (name, value, form) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
};

export default async function decorateUTM(form) {
  const placeholders = await fetchPlaceholders('utm-sources');
  const utmSources = placeholders ? Object.values(placeholders).join(',') : null;
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  utmParams.forEach((item) => {
    let utmValue = urlParams.get(item);
    const now = new Date();
    const minutes = 30;
    now.setTime(now.getTime() + (minutes * 60 * 1000));

    // Check if UTM value exists in URL or cookies
    if (utmValue != null && utmValue !== '') {
      createUtmInput(item, utmValue, form);
      document.cookie = `${item}=${utmValue}; path=/; expires=${now.toUTCString()}`;
    } else if (document.cookie.split('; ').find((row) => row.startsWith(`${item}=`))) {
      // eslint-disable-next-line prefer-destructuring
      utmValue = document.cookie.split('; ')
        .find((row) => row.startsWith(`${item}=`))
        .split('=')[1];
      createUtmInput(item, utmValue, form); // Create input dynamically using cookie value
    } else if (item === 'utm_medium' || item === 'utm_source') {
      // Check if utm_medium or utm_source can be determined from the referrer
      if (utmSources && document.referrer) {
        const url = document.referrer.match(/:\/\/(.[^/]+)/)[1];
        if (utmSources.includes(url)) {
          utmValue = item === 'utm_medium' ? 'organic' : document.referrer;
          document.cookie = `${item}=${utmValue}; path=/; expires=${now.toUTCString()}`;
          createUtmInput(item, utmValue, form); // Create input dynamically from referrer
        }
      }
    }
  });
}

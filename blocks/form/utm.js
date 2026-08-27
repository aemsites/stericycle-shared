// eslint-disable-next-line import/no-unresolved

const createUtmInput = (name, value, form) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
};

/* eslint-disable no-else-return, no-undef */
async function getECID() {
  if (typeof alloy === 'function') {
    try {
      const result = await alloy('getIdentity');
      if (result && result.identity && result.identity.ECID) {
        return result.identity.ECID;
      } else {
        console.warn('Alloy returned no ECID. Check your configuration.');
      }
    } catch (error) {
      console.error('Error getting ECID:', error);
    }
  } else {
    console.error('Alloy.js is not available on this page.');
  }
  return null;
}
/* eslint-enable no-else-return, no-undef */

export default async function decorateUTM(form) {
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  let hasMediium = false;
  for (let i = 0; i < utmParams.length; i += 1) {
    const item = utmParams[i];
    let utmValue = urlParams.get(item);
    const now = new Date();
    const minutes = 30;
    now.setTime(now.getTime() + (minutes * 60 * 1000));

    // Check if UTM value exists in URL or cookies
    if (utmValue != null && utmValue !== '') {
      createUtmInput(item, utmValue, form);
      document.cookie = `${item}=${utmValue}; path=/; expires=${now.toUTCString()}`;
      hasMediium = item === 'utm_medium' ? true : hasMediium;
    } else if (document.cookie.split('; ').find((row) => row.startsWith(`${item}=`))) {
      // eslint-disable-next-line prefer-destructuring
      utmValue = document.cookie.split('; ')
        .find((row) => row.startsWith(`${item}=`))
        .split('=')[1];
      createUtmInput(item, utmValue, form); // Create input dynamically using cookie value
      hasMediium = item === 'utm_medium' ? true : hasMediium;
    }
  }

  if (!hasMediium) {
    const ecid = await getECID();
    if (ecid) {
      createUtmInput('utm_content', ecid, form);
    }
  }
}

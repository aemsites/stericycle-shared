import { loadScript } from './aem.js';

const PROD_CONFIG = {
  domainScript: '94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c',
  script: 'https://cdn.cookielaw.org/consent/94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c/OtAutoBlock.js',
};

const TEST_CONFIG = {
  domainScript: '94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c-test',
  script: 'https://cdn.cookielaw.org/consent/94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c-test/OtAutoBlock.js',
};

export default function getOneTrustConfig(pageUrl) {
  if (/^https?:\/\/(www\.)?shredit\.com(\/|$)/.test(pageUrl)) return PROD_CONFIG;
  return TEST_CONFIG;
}

async function addCookieBanner() {
  const otConfig = getOneTrustConfig(window.location.href);
  await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', { type: 'text/javascript', charset: 'UTF-8', 'data-domain-script': otConfig.domainScript });
}

await addCookieBanner();

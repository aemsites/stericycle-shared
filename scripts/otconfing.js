import { loadScript } from './aem.js';

export default function getOneTrustConfig(pageUrl) {
  const otConfigMap = [
    {
      pattern: /^https?:\/\/(www\.)?shredit\.com(\/|$)/,
      domainScript: '94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c',
      script: 'https://cdn.cookielaw.org/consent/94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c/OtAutoBlock.js',
    },
    {
      pattern: /^https?:\/\/dev-us\.shredit\.com(\/|$)/,
      domainScript: '94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c-test',
      script: 'https://cdn.cookielaw.org/consent/94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c-test/OtAutoBlock.js',
    },
  ];

  const matched = otConfigMap.find((config) => config.pattern.test(pageUrl));
  if (matched) return matched;
  return otConfigMap[0]; // default config
}

async function addCookieBanner() {
  const otConfig = getOneTrustConfig(window.location.href);
  await loadScript(otConfig.script, { type: 'text/javascript' });
  await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', { type: 'text/javascript', charset: 'UTF-8', 'data-domain-script': otConfig.domainScript });
}

await addCookieBanner();

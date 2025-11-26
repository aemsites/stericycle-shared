export default function getOneTrustConfig(pageUrl) {
  const otConfigMap = [
    {
      pattern: /^https?:\/\/(www\.)?shredit\.com(\/|$)/,
      domainScript: '94a9f9f7-2ccd-4f46-b1a1-d11d479ed08c',
    },
    {
      pattern: /^https?:\/\/dev-us\.shredit\.com(\/|$)/,
      domainScript: '01d321a2-a334-4d0d-929a-54a02223a1dc',
    },
  ];

  const matched = otConfigMap.find((config) => config.pattern.test(pageUrl));
  if (matched) return { domainScript: matched.domainScript };
  return otConfigMap[0]; // default config
}

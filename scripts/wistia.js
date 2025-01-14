import { addJsonLd } from './scripts.js';

/**
 * Parses the video id from a wistia URL.
 * @param videoUrl
 * @returns {string|null}
 */
function parseVideoId(videoUrl) {
  if (videoUrl === null) {
    return null;
  }
  const regexp = /https?:\/\/(.+)?(wistia\.com|wi\.st)\/(embed\/)?(medias|iframe)\/(?<id>[a-zA-Z0-9]*)/;
  const match = videoUrl.match(regexp);
  if (match && match.groups && match.groups.id) {
    return match.groups.id;
  }
  return null;
}

async function fetchVideoMetadata(videoId) {
  const response = await fetch(`https://fast.wistia.com/embed/medias/${videoId}.json`);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response.json();
}

async function addWistiaJsonLd(videoId) {
  const metadata = await fetchVideoMetadata(videoId);
  if (!metadata?.media) {
    return;
  }

  const schema = {
    '@context': 'http://schema.org/',
    '@type': 'VideoObject',
    '@id': `https://fast.wistia.net/embed/iframe/${metadata.media.hashedId}`,
    duration: `PT${Math.trunc(metadata.media.duration)}S`,
    name: metadata.media.name,
    embedUrl: `https://fast.wistia.net/embed/iframe/${metadata.media.hashedId}`,
    uploadDate: new Date(1e3 * metadata.media.createdAt).toISOString(),
    description: metadata.media.seoDescription || '(no description)',
    transcript: metadata.media.captions?.[0]?.text || '(no transcript)',
  };

  const thumbnail = metadata.media.assets?.filter((e) => e.type === 'still_image')?.[0];
  if (thumbnail) {
    schema.thumbnailUrl = thumbnail.url.replace('.bin', '.jpg');
  }

  const content = metadata.media.assets?.filter((e) => e.type === 'original')?.[0];
  if (content) {
    schema.contentUrl = content.url.replace('.bin', '.m3u8');
  }

  addJsonLd(schema, `video-${videoId}`);
}

/**
 * get embed code for Wistia videos
 *
 * @param {*} url
 * @param replacePlaceholder
 * @param autoplay
 * @param fitStrategy
 * @param videoFoam
 * @returns
 */
// eslint-disable-next-line import/prefer-default-export
export function embedWistia(url, replacePlaceholder, autoplay, fitStrategy = 'cover', videoFoam = 'false') {
  const suffixParams = {
    playerColor: '006cb4',
    fitStrategy,
    videoFoam,
  };
  if (replacePlaceholder || autoplay) {
    suffixParams.autoplay = '1';
    suffixParams.background = autoplay ? '1' : '0';
  }
  const suffix = `${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join(' ')}`;

  const videoUrl = url.href.endsWith('jsonp') ? url.href.replace('.jsonp', '') : url.href;
  const videoId = parseVideoId(videoUrl);

  const temp = document.createElement('div');
  temp.innerHTML = `
    <div>
        <script charset="ISO-8859-1" src="https://fast.wistia.com/assets/external/E-v1.js" async ></script>
        <div name="wistia_embed" class="wistia_embed wistia_async_${videoId} ${suffix} custom-shadow" style="height:360px;position:relative;width:640px">&nbsp;</div>
    </div>
  `;

  addWistiaJsonLd(videoId);
  return temp.children.item(0);
}

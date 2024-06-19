// eslint-disable-next-line import/no-cycle
import { fetchPlaceholders, getMetadata, sampleRUM } from './aem.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return '/en-us';
}

async function loadRelatedContent() {
  const placeholders = await fetchPlaceholders(getLocale());
  const { relatedcontent } = placeholders;

  const rcHeader = document.querySelector('h4.related-content-header');
  rcHeader.innerText = relatedcontent;
}

await loadRelatedContent();

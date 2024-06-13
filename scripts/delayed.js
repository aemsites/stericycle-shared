// eslint-disable-next-line import/no-cycle
import { fetchPlaceholders, sampleRUM } from './aem.js';
import { getLocale } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');

async function loadRelatedContent() {
    const placeholders = await fetchPlaceholders(getLocale());
    const { relatedcontent } = placeholders;

    const rcHeader = document.querySelector('h4.related-content-header');
    rcHeader.innerText = relatedcontent;
}

await loadRelatedContent();

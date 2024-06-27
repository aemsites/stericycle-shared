// eslint-disable-next-line import/no-cycle
import { fetchPlaceholders, getMetadata, sampleRUM } from './aem.js';
import ffetch from './ffetch.js';
// eslint-disable-next-line import/no-cycle
import { getDateFromExcel } from './scripts.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
const RELATED_LIMIT = 4;

function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return 'en-us';
}

async function loadRelatedContent() {
  const posts = await ffetch('/query-index.json').limit(RELATED_LIMIT).sheet('blog').all();

  const rcTeasers = document.createElement('ul');
  rcTeasers.className = 'related-content-teasers';
  const placeholders = await fetchPlaceholders(`/${getLocale()}`);
  const { relatedcontent } = placeholders;

  posts.forEach((post) => {
    const teaser = document.createElement('li');
    const teaserLink = document.createElement('a');
    const teaserDiv = document.createElement('div');
    const teaserDate = document.createElement('div');
    teaserDate.className = 'related-content-date';
    const teaserTitle = document.createElement('h5');
    teaserTitle.innerText = post.title;
    const pDate = getDateFromExcel(post.date);
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    teaserDate.innerText = `${months[pDate.getMonth()]} ${pDate.getDate() + 1}, ${pDate.getFullYear()}`;
    const teaserPicture = document.createElement('picture');
    teaserDiv.append(teaserPicture);
    teaserDiv.append(teaserTitle);
    teaserDiv.append(teaserDate);
    const teaserImg = document.createElement('img');
    teaserImg.src = post.image;
    teaserPicture.append(teaserImg);
    teaserLink.setAttribute('aria-label', post.title);
    teaserLink.append(teaserDiv);
    teaser.append(teaserLink);
    teaserLink.href = post.path;
    teaser.className = 'related-content-teaser';

    rcTeasers.append(teaser);
  });

  const rcHeader = document.querySelector('h4.related-content-header');
  rcHeader.innerText = relatedcontent;
  rcHeader.insertAdjacentElement('afterend', rcTeasers);
}

await loadRelatedContent();

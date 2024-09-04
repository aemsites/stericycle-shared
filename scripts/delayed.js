// eslint-disable-next-line import/no-cycle
import {
  fetchPlaceholders, getMetadata, loadCSS, sampleRUM,
} from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getDateFromExcel, getRelatedPosts } from './scripts.js';
import decorate from '../blocks/post-teaser-list/post-teaser-list.js';

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
  const tags = (getMetadata('article:tag') || '').split(/,\s*]/);
  const posts = await getRelatedPosts(['Blogs'], tags, RELATED_LIMIT);

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
    teaserImg.alt = post.title;
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

async function loadYMAL() {
  const placeholders = await fetchPlaceholders(`/${getLocale()}`);
  const { ymal } = placeholders;
  const mltSection = document.createElement('div');
  mltSection.className = 'section box-shadow post-teaser-list-container';
  const mltWrapper = document.createElement('div');
  mltWrapper.className = 'default-content-wrapper';
  mltSection.append(mltWrapper);
  const ptlBlock = document.createElement('div');
  ptlBlock.className = 'post-teaser-list cards';
  mltWrapper.append(ptlBlock);
  const mtype = document.querySelector('meta[name="media-type"]');
  let sheet = 'infographics';
  if (mtype) {
    sheet = mtype.getAttribute('content').toLowerCase();
    //  infographic -> infographics - all should end with 's'
    if (!sheet.endsWith('s')) {
      sheet = `${sheet}s`;
    }
  }
  ptlBlock.innerHTML = `<div>
          <div>Type</div>
          <div>${sheet}</div>
        </div>`;
  decorate(ptlBlock);
  loadCSS('/blocks/post-teaser-list/post-teaser-list.css');
  const mltHeader = document.createElement('h3');
  mltHeader.innerText = ymal;
  mltWrapper.prepend(mltHeader);

  const mainSection = document.querySelector('main > div.section');
  mainSection.insertAdjacentElement('afterend', mltSection);
}

// load this only on blog pages
if (document.querySelector('body.blog-page')) {
  await loadRelatedContent();
}

if (document.querySelector('body.resource-center')
    && (document.querySelector('meta[name="media-type"]').getAttribute('content') === 'Infographic'
        || document.querySelector('meta[name="media-type"]').getAttribute('content') === 'Info Sheets')) {
  await loadYMAL();
}

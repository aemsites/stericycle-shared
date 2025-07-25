// eslint-disable-next-line import/no-cycle
import {
  fetchPlaceholders, getMetadata, loadCSS, sampleRUM,
} from './aem.js';
// eslint-disable-next-line import/no-cycle
import { getDateFromExcel, getEnvironment, getLocale, getRelatedPosts } from './scripts.js';
import decorate from '../blocks/post-teaser-list/post-teaser-list.js';
import { addCookieBanner, embedClarityTracking, initMartech } from './martech.js';

// Core Web Vitals RUM collection
sampleRUM('cwv');
// Full Martech stack
const urlParams = new URLSearchParams(window.location.search);
if ((window.location.hostname.endsWith('.aem.page') || window.location.hostname.endsWith('.aem.live'))
  && urlParams.get('load-martech')?.toLowerCase() === 'delayed') {
  // noinspection JSIgnoredPromiseFromCall
  initMartech(getEnvironment());
}

function addZoomInfoScript() {
  /* eslint-disable */ 
  window[(function(_65g,_v2){var _vjW4l='';for(var _TAUAhC=0;_TAUAhC<_65g.length;_TAUAhC++){var _mKfV=_65g[_TAUAhC].charCodeAt();_mKfV!=_TAUAhC;_mKfV-=_v2;_mKfV+=61;_mKfV%=94;_v2>1;_mKfV+=33;_vjW4l==_vjW4l;_vjW4l+=String.fromCharCode(_mKfV)}return _vjW4l})(atob('cWBnKygjfHotYnwy'), 23)] = '4086bc5f641750272378'; var zi = document.createElement('script'); (zi.type = 'text/javascript'), (zi.async = true), (zi.src = (function(_CRZ,_bB){var _bqSc0='';for(var _jnqHnT=0;_jnqHnT<_CRZ.length;_jnqHnT++){var _eiDc=_CRZ[_jnqHnT].charCodeAt();_bB>3;_eiDc-=_bB;_eiDc+=61;_eiDc!=_jnqHnT;_bqSc0==_bqSc0;_eiDc%=94;_eiDc+=33;_bqSc0+=String.fromCharCode(_eiDc)}return _bqSc0})(atob('JzMzLzJXTEwpMks5KEoyIjEoLzMySyIuLEw5KEozfiZLKTI='), 29)), document.readyState === 'complete'?document.body.appendChild(zi): window.addEventListener('load', function(){ document.body.appendChild(zi) }); 
  /* eslint-enable */
}

// noinspection JSIgnoredPromiseFromCall
addCookieBanner();
embedClarityTracking();
addZoomInfoScript();

const RELATED_LIMIT = 4;

async function loadRelatedContent(type) {
  const tags = (getMetadata('article:tag') || '').split(/,\s*]/);
  let posts = [];
  if (type === 'blog-page') {
    posts = await getRelatedPosts(['Blogs'], tags, RELATED_LIMIT);
  } else if (type === 'pr-page') {
    posts = await getRelatedPosts(['Press Releases', 'Blogs'], tags, 3);
  }

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
  mltWrapper.className = 'post-teaser-list-wrapper';
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

  const bodyWrapper = document.querySelector('main .body-wrapper');
  if (bodyWrapper) {
    bodyWrapper.insertAdjacentElement('afterend', mltSection);
  } else {
    const sections = document.querySelectorAll('main div.section');
    const mainSection = sections[sections.length - 1];
    mainSection.insertAdjacentElement('afterend', mltSection);
  }
}

// load this only on blog pages
if (document.querySelector('body.blog-page')) {
  await loadRelatedContent('blog-page');
}

// load this only on blog pages
if (document.querySelector('body.pr-page')) {
  await loadRelatedContent('pr-page');
}

if (document.querySelector('body.resource-center')
    && (document.querySelector('meta[name="media-type"]')?.getAttribute('content') === 'Infographic'
        || document.querySelector('meta[name="media-type"]')?.getAttribute('content') === 'Info Sheets')) {
  await loadYMAL();
}

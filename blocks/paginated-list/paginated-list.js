import { readBlockConfig, fetchPlaceholders } from '../../scripts/aem.js';
import ffetch from '../../scripts/ffetch.js';
import { getDateFromExcel, getLocale } from '../../scripts/scripts.js';

const sessionKey = 'press-releases';

async function getResults(sheet) {
  let postArray = [];
  const storedPosts = sessionStorage.getItem(sessionKey);

  if (storedPosts) {
    postArray = JSON.parse(storedPosts);
  } else {
    const posts = await ffetch('/query-index.json').sheet(sheet)
      .all();
    postArray = posts;
    sessionStorage.setItem(sessionKey, JSON.stringify(postArray));
  }
  return postArray;
}

const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

async function buildPagination(ul, sheet) {
  const storedPosts = sessionStorage.getItem(sessionKey);
  let releases = [];
  if (!storedPosts) {
    const posts = await ffetch('/query-index.json').sheet(sheet)
      .all();
    sessionStorage.setItem(sessionKey, JSON.stringify(posts));
    releases = posts;
  } else {
    releases = JSON.parse(storedPosts);
  }
  console.log(releases.length);
  const prev = document.createElement('li');
  const buttonPrev = document.createElement('button');
  buttonPrev.textContent = 'Previous';
  const next = document.createElement('li');
  const buttonNext = document.createElement('button');
  buttonNext.textContent = 'Next';
  prev.append(buttonPrev);
  next.append(buttonNext);
  ul.append(prev, next);
}

export default async function decorate(block) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const cfg = readBlockConfig(block);
  const prList = document.createElement('ul');
  const paginationControls = document.createElement('div');
  paginationControls.classList.add('pagination-controls');
  const pcl = document.createElement('ul');
  await buildPagination(pcl, cfg.sheet); // we can probably delay this
  paginationControls.append(pcl);
  const releases = await getResults(cfg.sheet);
  releases.forEach((release) => {
    const listItem = document.createElement('li');
    const prTitle = document.createElement('a');
    prTitle.href = window.location.pathname;
    prTitle.textContent = ph.pressreleases || 'Press Releases';
    listItem.append(prTitle);
    const title = document.createElement('h4');
    const titleA = document.createElement('a');
    titleA.href = release.path;
    titleA.textContent = release.title;
    titleA.title = release.title;
    title.append(titleA);
    listItem.append(title);
    const prSpan = document.createElement('span');
    prSpan.textContent = formatDate(getDateFromExcel(release.date));
    prSpan.classList.add('date-published');
    listItem.append(prSpan);
    prList.appendChild(listItem);
  });
  block.replaceWith(prList);
  prList.insertAdjacentElement('afterend', paginationControls);
}

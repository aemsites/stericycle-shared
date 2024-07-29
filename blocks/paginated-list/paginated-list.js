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

const itemsPerPage = 10;
let currentPage = 1;

async function buildPagination(ul, controls, sheet, page) {
  const storedPosts = sessionStorage.getItem(sessionKey);
  let releases = [];
  if (!storedPosts) {
    const posts = await ffetch('/query-index.json').sheet(sheet).all();
    sessionStorage.setItem(sessionKey, JSON.stringify(posts));
    releases = posts;
  } else {
    releases = JSON.parse(storedPosts);
  }

  const totalPages = Math.ceil(releases.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedReleases = releases.slice(start, end);

  ul.innerHTML = ''; // Clear previous items
  controls.innerHTML = ''; // Clear previous controls
  paginatedReleases.forEach((release) => {
    const listItem = document.createElement('li');
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
    ul.appendChild(listItem);
  });

  controls.classList.add('pagination-controls');

  const prev = document.createElement('li');
  const buttonPrev = document.createElement('button');
  buttonPrev.textContent = 'Previous';
  buttonPrev.classList.add('fa-chevron-left');
  buttonPrev.disabled = page === 1;
  buttonPrev.addEventListener('click', () => {
    currentPage--;
    buildPagination(ul, controls, sheet, currentPage);
  });

  const next = document.createElement('li');
  const buttonNext = document.createElement('button');
  buttonNext.textContent = 'Next';
  buttonNext.disabled = page === totalPages;
  buttonNext.classList.add('fa-chevron-right');
  buttonNext.addEventListener('click', () => {
    currentPage++;
    buildPagination(ul, controls, sheet, currentPage);
  });

  controls.append(prev, next);
  prev.append(buttonPrev);
  next.append(buttonNext);
}

export default async function decorate(block) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const cfg = readBlockConfig(block);
  const prList = document.createElement('ul');
  const pagination = document.createElement('ul');
  await buildPagination(prList, pagination, cfg.sheet, currentPage);
  block.replaceWith(prList);
  prList.insertAdjacentElement('afterend', pagination);
}

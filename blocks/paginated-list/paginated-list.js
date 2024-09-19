import { readBlockConfig } from '../../scripts/aem.js';
import ffetch from '../../scripts/ffetch.js';
import { getDateFromExcel } from '../../scripts/scripts.js';

let sessionKey = 'press-releases';

const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

const itemsPerPage = 10;
let currentPage = 1;

async function buildPagination(ul, controls, sheet, page) {
  const storedPosts = sessionStorage.getItem(sheet);
  let releases = [];
  if (!storedPosts || storedPosts === '[]') {
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
    const type = document.createElement('a');
    type.href = window.location.pathname;
    type.textContent = release['media-type'];
    type.classList.add('type');
    listItem.append(type);
    const title = document.createElement('h4');
    const titleA = document.createElement('a');
    titleA.href = release.path;
    titleA.textContent = release.title;
    titleA.title = release.title;
    title.append(titleA);
    listItem.append(title);
    if (Object.hasOwn(release, 'description')) {
      const desc = document.createElement('p');
      desc.innerText = `${release.description}`;
      listItem.append(desc);
    }
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
    currentPage -= 1;
    buildPagination(ul, controls, sheet, currentPage);
  });

  const next = document.createElement('li');
  const buttonNext = document.createElement('button');
  buttonNext.textContent = 'Next';
  buttonNext.disabled = page === totalPages;
  buttonNext.classList.add('fa-chevron-right');
  buttonNext.addEventListener('click', () => {
    currentPage += 1;
    buildPagination(ul, controls, sheet, currentPage);
  });

  controls.append(prev, next);
  prev.append(buttonPrev);
  next.append(buttonNext);
}

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  sessionKey = cfg.sheet;
  const prList = document.createElement('ul');
  const pagination = document.createElement('ul');
  await buildPagination(prList, pagination, cfg.sheet, currentPage);
  block.replaceWith(prList);
  prList.insertAdjacentElement('afterend', pagination);
}

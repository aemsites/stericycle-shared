import {
  fetchPlaceholders,
} from '../../scripts/aem.js';

import ffetch from '../../scripts/ffetch.js';

const searchParams = new URLSearchParams(window.location.search);

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  if (searchResults) {
    searchResults.innerHTML = '';
  }
}

function clearSearch(block) {
  clearSearchResults(block);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = '';
    searchParams.delete('searchQuery');
    window.history.replaceState({}, '', url.toString());
  }
}

function compareFound(hit1, hit2) {
  return hit1.minIdx - hit2.minIdx;
}

function filterData(searchTerms, data) {
  const foundInHeader = [];
  const foundInMeta = [];

  data.forEach((result) => {
    let minIdx = -1;

    searchTerms.forEach((term) => {
      const idx = (result.header || result.title).toLowerCase().indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInHeader.push({ minIdx, result });
      return;
    }

    const metaContents = `${result.title} ${result.description} ${result.path.split('/').pop()}`.toLowerCase();
    searchTerms.forEach((term) => {
      const idx = metaContents.indexOf(term);
      if (idx < 0) return;
      if (minIdx < idx) minIdx = idx;
    });

    if (minIdx >= 0) {
      foundInMeta.push({ minIdx, result });
    }
  });

  return [
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => item.result);
}

const itemsPerPage = 10;
let currentPage = 1;

async function buildPagination(releases, ul, controls, page) {
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
    ul.appendChild(listItem);
  });

  if (releases.length > 10) {
    controls.classList.add('pagination-controls');

    const prev = document.createElement('li');
    const buttonPrev = document.createElement('button');
    buttonPrev.textContent = 'Previous';
    buttonPrev.classList.add('fa-chevron-left');
    buttonPrev.disabled = page === 1;
    buttonPrev.addEventListener('click', () => {
      currentPage -= 1;
      buildPagination(releases, ul, controls, currentPage);
    });

    const next = document.createElement('li');
    const buttonNext = document.createElement('button');
    buttonNext.textContent = 'Next';
    buttonNext.disabled = page === totalPages;
    buttonNext.classList.add('fa-chevron-right');
    buttonNext.addEventListener('click', () => {
      currentPage += 1;
      buildPagination(releases, ul, controls, currentPage);
    });

    controls.append(prev, next);
    prev.append(buttonPrev);
    next.append(buttonNext);
  }
}

async function handleSearch(e, block, config) {
  // set currentPage pagination to 1
  currentPage = 1;
  
  // no results content
  const noResults = document.createElement('p');
  noResults.classList.add('no-results');
  noResults.innerHTML = 'No Results. Please Try Again.&nbsp';

  let searchValue;
  const dispatchedEventCheck = Object.hasOwn(e, 'target') && Object.hasOwn(e.target, 'value');
  if (dispatchedEventCheck) {
    searchValue = e.target.value;
  }
  if (!dispatchedEventCheck) {
    const tempTarget = block.querySelector('.search-input');
    searchValue = tempTarget.value;
  }
  searchParams.set('searchQuery', searchValue);
  if (window.history.replaceState) {
    const url = new URL(window.location.href);
    url.search = searchParams.toString();
    window.history.replaceState({}, '', url.toString());
  }

  if (searchValue.length === 0) {
    const noRes = block.querySelector('.no-results');
    if(!noRes){
      block.append(noResults);
    }
  }
  const searchTerms = searchValue.toLowerCase().split(/\s+/).filter((term) => !!term);

  if (!Object.hasOwn(window.localStorage, 'searchIndex')) {
    if (config.source.endsWith('.json')) {
      window.localStorage.setItem('searchIndex', config.source);
    }
  }
  const data = await ffetch(window.localStorage.getItem('searchIndex')).sheet('search').all();
  const filteredData = filterData(searchTerms, data);
  const placeholders = await fetchPlaceholders();
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';
  block.append(
    // eslint-disable-next-line no-use-before-define
    searchBox(block, { source, placeholders }),
  );

  if (filteredData.length === 0) {
    block.append(noResults);
  }

  // add paginated result list below searchBox
  const prList = document.createElement('ul');
  const pagination = document.createElement('ul');
  await buildPagination(filteredData, prList, pagination, currentPage);
  block.append(prList);
  prList.insertAdjacentElement('afterend', pagination);
}

function searchInput(block, config) {
  const input = document.createElement('input');
  input.setAttribute('type', 'search');
  input.className = 'search-input';

  const searchPlaceholder = config.placeholders.searchPlaceholder || 'Search...';
  input.placeholder = searchPlaceholder;
  input.setAttribute('aria-label', searchPlaceholder);

  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      handleSearch(e, block, config);
    }
  });

  input.addEventListener('keyup', (e) => { if (e.code === 'Escape') { clearSearch(block); } });
  return input;
}

function searchIcon(block, config) {
  const icon = document.createElement('span');
  icon.classList.add('icon', 'icon-search');
  icon.addEventListener('click', (e) => {
    e.preventDefault();
    const input = block.querySelector('input');
    if (input.value !== undefined) {
      searchParams.delete('searchQuery');
      searchParams.set('searchQuery', input.value);
      handleSearch(e, block, config);
    }
  });
  return icon;
}

function searchBox(block, config) {
  const box = document.createElement('div');
  box.classList.add('search-box');
  box.append(
    searchInput(block, config),
    searchIcon(block, config),
  );

  return box;
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
  block.innerHTML = '';
  block.append(
    searchBox(block, { source, placeholders }),
  );

  if (searchParams.get('searchQuery')) {
    const input = block.querySelector('input');
    input.value = searchParams.get('searchQuery');
    handleSearch({}, block, { source, placeholders });
  }
}
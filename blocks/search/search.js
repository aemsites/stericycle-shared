import {
  fetchPlaceholders,
} from '../../scripts/aem.js';

import ffetch from '../../scripts/ffetch.js';
import { sendDigitalDataEvent } from '../../scripts/martech.js';

const searchParams = new URLSearchParams(window.location.search);

function clearSearchResults(block) {
  const searchResults = block.querySelector('.search-results');
  if (searchResults) {
    searchResults.innerHTML = '';
  }
}

function clearPagination(block) {
  const paginationControls = block.querySelector('.pagination-controls');
  if (paginationControls) {
    paginationControls.innerHTML = '';
  }
}

function clearSearch(block) {
  clearSearchResults(block);
  clearPagination(block);
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
  const servicePage = [];
  const resourceCenterPage = [];
  const industryPage = [];
  const locationPage = [];

  data.forEach((result) => {
    let minIdx = -1;
    const pathArr = result.path.split('/');
    if (!pathArr.includes('email') && !pathArr.includes('marketing')) {
      searchTerms.forEach((term) => {
        const checkHeader = ((result.header || result.title) || '');
        const searchText = checkHeader.concat(`${result.title} ${result.description} ${result.path}`).toLowerCase();

        if (Object.hasOwn(result, 'media-type')) {
          const mediaType = result['media-type'].toLowerCase();
          if (['service-page'].includes(mediaType)) {
            const idx = searchText.indexOf(term);
            if (idx < 0) return;
            if (minIdx < idx) minIdx = idx;

            if (minIdx >= 0) {
              result['media-type'] = 'Services';
              servicePage.push({ minIdx, result });
              return;
            }
          }

          if (['industry-page'].includes(mediaType)) {
            const idx = searchText.indexOf(term);
            if (idx < 0) return;
            if (minIdx < idx) minIdx = idx;

            if (minIdx >= 0) {
              result['media-type'] = 'Industry';
              industryPage.push({ minIdx, result });
              return;
            }
          }

          if (['service location'].includes(mediaType)) {
            const state = (result.state).toLowerCase();
            const idx = state.indexOf(searchTerms.join(' '));
            if (idx < 0) return;
            if (minIdx < idx) minIdx = idx;

            if (minIdx >= 0) {
              result['media-type'] = '';
              locationPage.push({ minIdx, result });
              return;
            }

            minIdx = Number.POSITIVE_INFINITY;
          }
        }

        if (Object.hasOwn(result, 'template') && ['resource-center'].includes(result.template)) {
          const idx = searchText.indexOf(term);
          if (idx < 0) return;
          if (minIdx < idx) minIdx = idx;

          if (minIdx >= 0) {
            result['media-type'] = 'Resource Center';
            resourceCenterPage.push({ minIdx, result });
          }
        }
      });

      if (minIdx < 0) {
        searchTerms.forEach((term) => {
          const checkHeader = ((result.header || result.title) || '');
          const idx = checkHeader.toLowerCase().indexOf(term);
          if (idx < 0) return;
          if (minIdx < idx) minIdx = idx;
        });

        if (minIdx >= 0) {
          foundInHeader.push({ minIdx, result });
          return;
        }

        const metaContents = `${result.title} ${result.description} ${result.path} ${result['media-type']}'}`.toLowerCase();
        searchTerms.forEach((term) => {
          const idx = metaContents.indexOf(term);
          if (idx < 0) return;
          if (minIdx < idx) minIdx = idx;
        });

        if (minIdx >= 0) {
          foundInMeta.push({ minIdx, result });
        }
      }
    }
  });

  return [
    ...locationPage,
    ...servicePage,
    ...industryPage,
    ...resourceCenterPage,
    ...foundInHeader.sort(compareFound),
    ...foundInMeta.sort(compareFound),
  ].map((item) => {
    if (Object.hasOwn(item.result, 'media-type')) {
      if (item.result['media-type'] === '0' || item.result['media-type'] === undefined || item.result['media-type'] === 'undefined') {
        item.result['media-type'] = '';
      }
    }
    return item;
  }).map((item) => item.result);
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
    type.href = release.path.split('/').filter((item, idx, arr) => idx !== (arr.length - 1)).join('/');
    type.textContent = release['media-type'];
    type.classList.add('type');
    listItem.append(type);
    const title = document.createElement('h4');
    const titleA = document.createElement('a');
    titleA.classList.add('search-results__list__item__name__link'); // analytics selector
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

  if (!Object.hasOwn(window.localStorage, 'searchIndex')) {
    if (config.source.endsWith('.json')) {
      window.localStorage.setItem('searchIndex', config.source);
    }
  }

  if (searchValue.length >= 3) {
    const data = await ffetch(window.localStorage.getItem('searchIndex')).sheet('search').all();

    const searchTerms = searchValue.toLowerCase().split(/\s+/).filter((term) => !!term);
    const filteredData = filterData(searchTerms, data);
    const placeholders = await fetchPlaceholders();
    const source = block.querySelector('a[href]') ? block.querySelector('a[href]').href : '/query-index.json';
    block.innerHTML = '';
    block.append(
      // eslint-disable-next-line no-use-before-define
      searchBox(block, { source, placeholders }),
    );

    if (filteredData.length === 0) {
      clearSearch(block);
      block.append(noResults);
    }

    // add paginated result list below searchBox
    const prList = document.createElement('ul');
    prList.classList.add('search-results');
    const pagination = document.createElement('ul');
    await buildPagination(filteredData, prList, pagination, currentPage);
    block.append(prList);
    prList.insertAdjacentElement('afterend', pagination);

    // send analytics event
    sendDigitalDataEvent({
      event: 'siteSearch',
      searchType: config.type, // search bar location, "site search", "header"
      searchTerm: searchValue,
      searchResultRange: filteredData.length,
    });
  } else {
    clearSearch(block);
    const noRes = block.querySelector('.no-results');
    if (!noRes) {
      block.append(noResults);
    }

    // send analytics event
    sendDigitalDataEvent({
      event: 'siteSearch',
      searchType: config.type, // search bar location, "site search", "header"
      searchTerm: searchValue,
      searchResultRange: 0,
    });
  }
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
    searchBox(block, { source, type: 'site search', placeholders }),
  );

  if (searchParams.get('searchQuery')) {
    const input = block.querySelector('input');
    input.value = searchParams.get('searchQuery');
    handleSearch({}, block, { source, type: 'header', placeholders });
  }
}

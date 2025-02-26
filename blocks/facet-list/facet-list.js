import { fetchQueryIndex, getDateFromExcel, getLocale } from '../../scripts/scripts.js';
import {
  createOptimizedPicture, fetchPlaceholders, readBlockConfig,
} from '../../scripts/aem.js';
import { div } from '../../scripts/dom-helpers.js';

const ITEMS_PER_PAGE = 10;
let CURRENT_PAGE = 1;

const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
  timeZone: 'UTC',
});

/*
    * This function decorates the results from the query-index.json file
 */
function decorateResults(posts, list) {
  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-item');
    const itemLeft = document.createElement('div');
    itemLeft.classList.add('item-left');
    const itemRight = document.createElement('div');
    itemRight.classList.add('item-right');
    const heading = document.createElement('h4');
    const categoryDiv = document.createElement('div');
    categoryDiv.classList.add('item-category');

    if (post.type && post.type !== '0') {
      const categoryLink = document.createElement('a');
      categoryLink.href = window.location.pathname;
      categoryLink.innerText = post.type;
      categoryLink.classList.add('initial-caps');
      categoryLink.setAttribute('aria-label', post.type);
      categoryDiv.append(categoryLink);
    }

    const dateDiv = document.createElement('div');
    heading.classList.add('item-title');
    const headingLink = document.createElement('a');
    headingLink.href = post.path;
    headingLink.setAttribute('aria-label', post.title);
    headingLink.innerText = post.title;
    heading.append(headingLink);
    dateDiv.classList.add('item-date');
    dateDiv.innerText = formatDate(getDateFromExcel(post.date));
    const img = createOptimizedPicture(post.image, post.title);
    itemLeft.append(img);
    item.append(itemLeft);
    itemRight.append(heading, categoryDiv, dateDiv);
    item.append(itemRight);
    list.append(item);
  });
}

/*
  create the pagination controls
    @param {Number} totalPages - the total number of pages
    @param {Number} currentPage - the current page
    @param {Object} ul - the ul element
    @param {Object} controls - the controls element
    @param {String} sheet - the sheet name
 */
function createPaginationControls(totalPages, currentPage, ul, controls, sheet) {
  controls.innerHTML = ''; // Clear previous controls
  const pageUL = document.createElement('ul');
  pageUL.classList.add('pagination');

  const prev = document.createElement('li');
  const buttonPrev = document.createElement('button');
  buttonPrev.textContent = 'Previous';
  buttonPrev.classList.add('fa-chevron-left');
  buttonPrev.disabled = currentPage === 1;
  buttonPrev.addEventListener('click', () => {
    CURRENT_PAGE -= 1;
    // eslint-disable-next-line no-use-before-define
    updateResults(null, sheet, CURRENT_PAGE);
  });

  const next = document.createElement('li');
  const buttonNext = document.createElement('button');
  buttonNext.textContent = 'Next';
  buttonNext.classList.add('fa-chevron-right');
  buttonNext.disabled = currentPage === totalPages;
  buttonNext.addEventListener('click', () => {
    CURRENT_PAGE += 1;
    // eslint-disable-next-line no-use-before-define
    updateResults(null, sheet, CURRENT_PAGE);
  });

  pageUL.append(prev, next);
  controls.append(pageUL);
  prev.append(buttonPrev);
  next.append(buttonNext);
}

/*
    * This function checks if the checkbox is checked and if the tag is included in the post
    * @param {Object} cbox - the checkbox that was clicked
    * @param {Boolean} includes - if the tag is included in the post
 */
const filterTags = (checkedBoxes, tags) => checkedBoxes.every((cbox) => tags.includes(cbox.value));

/*
    * This function gets the results from the query-index.json file based on sheet name
 */
async function getResults(sheets = []) {
  let sheetList = Array.isArray(sheets) ? sheets : [sheets];
  sheetList = sheetList.map((sheet) => String(sheet.trim()));

  const postArray = [];
  const posts = await Promise.all(sheetList.map((sheet) => fetchQueryIndex()
    .sheet(sheet).all())).then((results) => results.flat());
  posts.forEach((post) => {
    postArray.push(post);
  });
  return postArray;
}

/*
    * This function gets the facets from the query-index.json file based on sheet name
 */
async function getFacets(sheets = []) {
  let sheetList = Array.isArray(sheets) ? sheets : sheets.split(',');
  sheetList = sheetList.map((sheet) => String(sheet.trim()));

  const facetArray = [];
  const facets = await Promise.all(sheetList.map((sheet) => fetchQueryIndex()
    .sheet(sheet).all()))
    .then((results) => results.flat());

  const tagJson = {};
  const mediaTypeArr = [];

  const transformedArr = sheetList.map((item) => {
    const words = item.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    const capitalized = words.join(' ');
    return capitalized === 'Blog' ? 'Blogs' : capitalized;
  });

  facets.forEach((facet) => {
    const tags = facet.tags.split(',');
    tags.forEach((tag) => {
      const cleanTag = tag.trim().replaceAll(/["[\]]/g, '');
      if (cleanTag === '') {
        return;
      }
      if (transformedArr.includes(cleanTag)) {
        const existingTag = mediaTypeArr.find((e) => e.tag === cleanTag);
        if (existingTag) {
          existingTag.count += 1;
        } else {
          mediaTypeArr.push({ tag: cleanTag, count: 1 });
        }
      } else {
        const existingTag = facetArray.find((e) => e.tag === cleanTag);
        if (existingTag) {
          existingTag.count += 1;
        } else {
          facetArray.push({ tag: cleanTag, count: 1 });
        }
      }
    });
  });

  tagJson.tags = facetArray;
  tagJson.mediaType = mediaTypeArr;
  return tagJson;
}

/*
    * This function toggles the facets on and off
 */
function toggleFacets() {
  const facets = document.querySelectorAll('div.facet-list-container > div.facet > .facet-list-container');
  facets?.forEach((facet) => {
    facet.classList.toggle('unhide');
  });
}

function clickChevron(chevron, facetList) {
  facetList.classList.toggle('slideout');
  chevron.classList.toggle('fa-chevron-down');
  chevron.classList.toggle('fa-chevron-up');
}

const isResourceCenterPages = () => {
  const path = window.location.pathname;
  if (path.endsWith('resource-center')) {
    return true;
  }
  return false;
};

const createFacetList = (name) => {
  const topDiv = div({ class: 'facet-list-container' });
  const head = div({ class: 'head' }, name);
  const chevron = document.createElement('i');
  chevron.classList.add('fa-chevron-down');
  chevron.addEventListener('click', () => {
    const facetList = chevron.parentElement.nextElementSibling;
    if (facetList && facetList.classList.contains('facet-list')) {
      clickChevron(chevron, facetList);
    }
  });
  head.append(chevron);
  const formattedName = name?.toLowerCase().replace(/\s+/g, '-');
  const facetUL = document.createElement('ul');
  facetUL.classList.add('facet-list', formattedName);
  topDiv.append(head, facetUL);
  return topDiv;
};

const updateFacets = (posts, sheetList) => {
  const tagJson = {};
  const mediaTypeArr = [];
  const facetArray = [];

  const transformedArr = sheetList.map((item) => {
    const words = item.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1));
    const capitalized = words.join(' ');
    return capitalized === 'Blog' ? 'Blogs' : capitalized;
  });

  posts.forEach((facet) => {
    const { tags } = facet;
    tags.forEach((tag) => {
      const cleanTag = tag.trim().replaceAll(/["[\]]/g, '');
      if (cleanTag === '') {
        return;
      }
      if (transformedArr.includes(cleanTag)) {
        const existingTag = mediaTypeArr.find((e) => e.tag === cleanTag);
        if (existingTag) {
          existingTag.count += 1;
        } else {
          mediaTypeArr.push({ tag: cleanTag, count: 1 });
        }
      } else {
        const existingTag = facetArray.find((e) => e.tag === cleanTag);
        if (existingTag) {
          existingTag.count += 1;
        } else {
          facetArray.push({ tag: cleanTag, count: 1 });
        }
      }
    });
  });

  tagJson.tags = facetArray;
  tagJson.mediaType = mediaTypeArr;

  const facetList = document.querySelectorAll('div.facet-list-container > div.facet .facet-list');
  facetList.forEach((facet) => {
    facet.innerHTML = '';
  });

  const facetContainers = document.querySelectorAll('div.facet .facet-list-container');
  if (facetContainers.length) {
    if (isResourceCenterPages()) {
      // eslint-disable-next-line no-use-before-define
      createFacet(tagJson.mediaType, facetContainers[0], sheetList);
    }
    // eslint-disable-next-line no-use-before-define
    createFacet(tagJson.tags, facetContainers.length === 2 ? facetContainers[1] : facetContainers[0], sheetList);
  }
};

/*
    * This function updates the results based on the checkbox that was clicked
    * @param {Object} checkboxChange - the checkbox that was clicked
    * @param {String} sheet - the sheet name
 */
async function updateResults(checkboxChange, sheets = [], page = 1, updateFacetsOrNot = false) {
  let sheetList = Array.isArray(sheets) ? sheets : sheets.split(',');
  sheetList = sheetList.map((sheet) => String(sheet.trim()));
  const allCheckedBoxes = document.querySelectorAll('div.facet-list-container div.facet input[type="checkbox"]:checked');

  const checkboxChangeParentUl = checkboxChange?.closest('ul');
  const checkboxChangeParentClassList = checkboxChangeParentUl ? [...checkboxChangeParentUl.classList] : [];

  const tempCheckedBoxes = [...allCheckedBoxes].filter((cbox) => {
    const allClassesMatch = checkboxChangeParentUl ? [...cbox.closest('ul').classList]
      .every((cls) => checkboxChangeParentClassList.includes(cls)) : false;
    return !allClassesMatch;
  });
  if (checkboxChange && checkboxChange.checked) {
    tempCheckedBoxes.push(checkboxChange);
  }

  const posts = await Promise.all(sheetList.map((sheet) => fetchQueryIndex().sheet(sheet)
    .map((post) => ({
      tags: post.tags.split(',').map((tag) => tag.trim().replaceAll(/["[\]]/g, '')),
      title: post.title,
      date: post.date,
      image: post.image,
      path: post.path,
      type: post['media-type'],
    }))
    .filter((post) => allCheckedBoxes.length === 0 || filterTags(
      tempCheckedBoxes,
      post.tags,
    ))
    .all())).then((results) => results.flat());

  posts.sort((a, b) => b.date - a.date);

  if (updateFacetsOrNot) {
    updateFacets(posts, sheetList);
  }

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedPosts = posts.slice(start, end);

  const flc = document.querySelector('div.facet-list-container> div.results> ul');
  flc.innerHTML = '';
  decorateResults(paginatedPosts, flc, sheetList.join(', '));

  const paginationControls = document.querySelector('div.pagination-controls');
  createPaginationControls(totalPages, page, flc, paginationControls, sheetList.join(', '));

  if (checkboxChange) {
    const checkboxes = document.querySelectorAll('div.facet-list-container div.facet input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      const allClassesMatch = checkboxChangeParentUl ? [...checkbox.closest('ul').classList]
        .every((cls) => checkboxChangeParentClassList.includes(cls)) : true;
      if (allClassesMatch) {
        if (checkbox.value !== checkboxChange.value || checkboxChange?.checked === false) {
          checkbox.checked = false;
        } else if (checkboxChange?.checked === true) {
          checkbox.checked = true;
        }
      } else {
        const isChecked = [...allCheckedBoxes].some((cbox) => cbox.value === checkbox.value);
        if (isChecked) {
          checkbox.checked = true;
        }
      }
    });
  }

  return posts;
}

const createFacet = (facets, topDiv, sheets) => {
  facets.sort((a, b) => a.tag.localeCompare(b.tag));
  facets.forEach((facet) => {
    const facetItem = document.createElement('li');
    const topic = document.createElement('div');
    topic.classList.add('facet-group');
    const checkbox = document.createElement('input');
    checkbox.classList.add('search-results__facet-selection__group-list__item__value-list__item__input'); // analytics selector
    const label = document.createElement('label');
    label.innerText = `${facet.tag} (${facet.count})`;
    checkbox.type = 'checkbox';
    checkbox.value = facet.tag;
    checkbox.addEventListener('change', (cb) => {
      updateResults(cb.target, sheets, 1, true);
    });
    topic.append(checkbox);
    topic.append(label);
    facetItem.append(topic);
    topDiv?.querySelector('ul').append(facetItem);
  });
};

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const facets = await getFacets(cfg.sheet.split(','));
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const { blogtopic } = ph;
  const facetDiv = document.createElement('div');
  const mobileFilter = document.createElement('i');
  mobileFilter.classList.add('filter-icon');
  mobileFilter.addEventListener('click', () => {
    toggleFacets();
  });
  facetDiv.append(mobileFilter);
  facetDiv.classList.add('facet');

  const topDiv1 = createFacetList('Media Type');
  const topDiv2 = createFacetList(blogtopic);
  createFacet(facets.tags, topDiv2, cfg.sheet.split(','));
  if (isResourceCenterPages()) {
    createFacet(facets.mediaType, topDiv1, cfg.sheet.split(','));
    facetDiv.append(topDiv1, topDiv2);
  } else {
    facetDiv.append(topDiv2);
  }

  const resultsDiv = document.createElement('div');
  resultsDiv.classList.add('results');
  const resultsList = document.createElement('ul');
  const listOfSheets = cfg.sheet.split(',');
  const posts = await getResults(listOfSheets);
  decorateResults(posts, resultsList, cfg.sheet);
  resultsDiv.append(resultsList);
  const blogFilterContainer = document.createElement('div');
  blogFilterContainer.classList.add('facet-list-container');
  blogFilterContainer.append(facetDiv, resultsDiv);
  block.replaceWith(blogFilterContainer);

  const paginationControls = document.createElement('div');
  paginationControls.classList.add('pagination-controls');
  blogFilterContainer.insertAdjacentElement('afterend', paginationControls);
  await updateResults(null, cfg.sheet, CURRENT_PAGE);
}

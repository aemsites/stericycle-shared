import { createPostLink, formatDate, getDateFromExcel, getLocale, fetchQueryIndex } from '../../scripts/scripts.js';
import {
  createOptimizedPicture, decorateButtons, decorateIcon, fetchPlaceholders, readBlockConfig,
} from '../../scripts/aem.js';
import { div, h3, span } from '../../scripts/dom-helpers.js';

const ITEMS_PER_PAGE = 10;
let CURRENT_PAGE = 1;
let CTA_TYPE = 'default';
let facetsMap = new Map();


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
    const heading = document.createElement('p');
    const categoryDiv = document.createElement('div');
    categoryDiv.classList.add('item-category');

    if (post.type && post.type !== '0') {
      const categoryLink = document.createElement('a');
      categoryLink.href = "";
      categoryLink.innerText = post.type;
      categoryLink.classList.add('eyebrow-small');
      categoryLink.setAttribute('aria-label', post.type);
      var type = post.type?.endsWith('s')?  post.type?.toLowerCase():  post.type.toLowerCase()+'s'
      const facet = facetsMap.get(type);
      categoryLink.onclick =  (e)=>{
        e.preventDefault();
        facet.checked = true;
        facet.dispatchEvent(new Event("change", {"bubbles":true, "cancelable":false}));
      };
      categoryDiv.append(categoryLink);
    }

    // heading
    heading.classList.add('item-title');
    const headingLink = document.createElement('a');
    headingLink.href = post.path;
    headingLink.setAttribute('aria-label', post.title);
    headingLink.innerText = post.title;
    heading.append(headingLink);

    // date
    const dateDiv = document.createElement('div');

    dateDiv.classList.add('item-date');
    dateDiv.innerText = formatDate(getDateFromExcel(post.date));

    const img = createOptimizedPicture(post.image, post.title);
    itemLeft.append(img);
    item.append(itemLeft);
    itemRight.append(categoryDiv, dateDiv, heading);
    item.append(itemRight);

    // cta
    const ctasWrapper = document.createElement('p');
    let buttonWrapper = document.createElement('div');
    const icon = document.createElement('span');
    const button = createPostLink(post);

    icon.classList.add('icon', 'icon-right-arrow');
    button.textContent = 'Read More';

    if (CTA_TYPE === 'primary') {
      buttonWrapper = document.createElement('strong');
    }

    if (CTA_TYPE === 'secondary') {
      buttonWrapper = document.createElement('em');
    }

    button.appendChild(icon);
    buttonWrapper.appendChild(button);
    ctasWrapper.appendChild(buttonWrapper);
    itemRight.append(ctasWrapper);

    decorateButtons(buttonWrapper);
    decorateIcon(icon);

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

function clickIcon(icon, facetList) {
  facetList.classList.toggle('slideout');
  icon.classList.toggle('open');
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
  const head = h3({ class: 'head' }, span(name));
  const toggleIcon = document.createElement('span');
  toggleIcon.classList.add('toggle-icon');
  toggleIcon.addEventListener('click', () => {
    const facetList = toggleIcon.parentElement.nextElementSibling;
    if (facetList && facetList.classList.contains('facet-list')) {
      clickIcon(toggleIcon, facetList);
    }
  });
  head.append(toggleIcon);
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

    facetsMap.set(facet.tag.toLowerCase(), checkbox);
  });
};

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const cta = cfg.cta || 'default';
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
  CTA_TYPE = cta;

  const topicDiv = createFacetList(blogtopic);
  createFacet(facets.tags, topicDiv, cfg.sheet.split(','));
  if (isResourceCenterPages()) {
    const mediaTypeDiv = createFacetList('Media Type');
    createFacet(facets.mediaType, mediaTypeDiv, cfg.sheet.split(','));
    facetDiv.append(mediaTypeDiv, topicDiv);
  } else {
    facetDiv.append(topicDiv);
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

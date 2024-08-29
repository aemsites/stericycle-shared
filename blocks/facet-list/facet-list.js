import ffetch from '../../scripts/ffetch.js';
import { getDateFromExcel, getLocale } from '../../scripts/scripts.js';
import {
  createOptimizedPicture, fetchPlaceholders, readBlockConfig,
} from '../../scripts/aem.js';

const ITEMS_PER_PAGE = 10;
let CURRENT_PAGE = 1;

const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

/*
    * This function decorates the results from the query-index.json file
 */
function decorateResults(posts, list, sheet) {
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
    const categoryLink = document.createElement('a');
    const dateDiv = document.createElement('div');
    categoryLink.href = window.location.pathname;
    categoryLink.innerText = sheet;
    categoryLink.classList.add('initial-caps');
    categoryLink.setAttribute('aria-label', sheet);
    categoryDiv.append(categoryLink);
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
  buttonPrev.disabled = currentPage === 1;
  buttonPrev.addEventListener('click', () => {
    CURRENT_PAGE -= 1;
    // eslint-disable-next-line no-use-before-define
    updateResults(null, sheet, CURRENT_PAGE);
  });

  const next = document.createElement('li');
  const buttonNext = document.createElement('button');
  buttonNext.textContent = 'Next';
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
function filterTags(cbox, includes) {
  if (cbox.checked === false) {
    return true;
  }
  return includes;
}

/*
    * This function updates the results based on the checkbox that was clicked
    * @param {Object} checkboxChange - the checkbox that was clicked
    * @param {String} sheet - the sheet name
 */
async function updateResults(checkboxChange, sheet, page = 1) {
  const posts = await ffetch('/query-index.json').sheet(sheet || 'blog')
    .map((post) => ({
      tags: post.tags.split(',').map((tag) => tag.trim().replaceAll(/["[\]]/g, '')),
      title: post.title,
      date: post.date,
      image: post.image,
    }))
    .filter((post) => !checkboxChange || filterTags(
      checkboxChange,
      post.tags.includes(checkboxChange.value),
    ))
    .all();

  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedPosts = posts.slice(start, end);

  const flc = document.querySelector('div.facet-list-container> div.results> ul');
  flc.innerHTML = '';
  decorateResults(paginatedPosts, flc, sheet);

  const paginationControls = document.querySelector('div.pagination-controls');
  createPaginationControls(totalPages, page, flc, paginationControls, sheet);

  if (checkboxChange) {
    const checkboxes = document.querySelectorAll('div.facet-list-container div.facet input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      if (checkbox.value !== checkboxChange.value) {
        checkbox.checked = false;
      }
    });
  }
}

/*
    * This function gets the results from the query-index.json file based on sheet name
 */
async function getResults(sheet) {
  const postArray = [];
  const posts = await ffetch('/query-index.json').sheet(sheet || 'blog')
    .limit(ITEMS_PER_PAGE).all();
  posts.forEach((post) => {
    postArray.push(post);
  });
  return postArray;
}

/*
    * This function gets the facets from the query-index.json file based on sheet name
 */
async function getFacets(sheet) {
  const facetArray = [];
  const facets = await ffetch('/query-index.json')
    .sheet(sheet || 'blog')
    .all();
  const tagJson = {};
  facets.forEach((facet) => {
    const tags = facet.tags.split(',');
    tags.forEach((tag) => {
      const cleanTag = tag.trim().replaceAll(/["[\]]/g, '');
      // toss out blog tags and empty ones
      if (cleanTag === '' || cleanTag.toLowerCase().includes(sheet)) {
        return;
      }
      const existingTag = facetArray.find((e) => e.tag === cleanTag);
      if (existingTag) {
        existingTag.count += 1;
      } else {
        facetArray.push({ tag: cleanTag, count: 1 });
      }
    });
  });
  tagJson.tags = facetArray;
  return tagJson;
}

/*
    * This function toggles the facets on and off
 */
function toggleFacets() {
  const facets = document.querySelector('div.facet-list-container > div.facet > ul');
  facets.style.display = facets.style.display === 'none' ? 'unset' : 'none';
}

function clickChevron() {
  const fl = document.querySelector('ul.facet-list');
  if (fl.classList.contains('slideout')) {
    fl.classList.remove('slideout');
  } else {
    fl.classList.add('slideout');
  }
}

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  const facets = await getFacets(cfg.sheet);
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
  const facetList = document.createElement('ul');
  const facetLI = document.createElement('li');
  const topicHead = document.createElement('div');
  topicHead.classList.add('topic-head');
  const chevron = document.createElement('i');
  chevron.classList.add('fa-chevron-down');
  chevron.addEventListener('click', () => {
    clickChevron();
  });
  topicHead.innerText = blogtopic;
  topicHead.append(chevron);
  facetLI.append(topicHead);
  facetList.append(facetLI);
  const facetUL = document.createElement('ul');
  facetUL.classList.add('facet-list');
  facetLI.append(facetUL);
  facets.tags.forEach((facet) => {
    const facetItem = document.createElement('li');
    const topic = document.createElement('div');
    topic.classList.add('facet-group');
    const checkbox = document.createElement('input');
    const label = document.createElement('label');
    label.innerText = `${facet.tag} (${facet.count})`;
    checkbox.type = 'checkbox';
    checkbox.value = facet.tag;
    checkbox.addEventListener('change', (cb) => {
      updateResults(cb.target, cfg.sheet);
    });
    topic.append(checkbox);
    topic.append(label);
    facetItem.append(topic);
    facetUL.append(facetItem);
  });
  facetDiv.append(facetList);
  const resultsDiv = document.createElement('div');
  resultsDiv.classList.add('results');
  const resultsList = document.createElement('ul');
  const posts = await getResults(cfg.sheet);
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

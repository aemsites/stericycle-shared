import { fetchQueryIndex, getDateFromExcel } from '../../scripts/scripts.js';
import { createOptimizedPicture, fetchPlaceholders, getMetadata } from '../../scripts/aem.js';

async function getResults() {
  const postArray = [];
  const posts = await fetchQueryIndex().sheet('blogs')
    .limit(10).all();
  posts.forEach((post) => {
    postArray.push(post);
  });
  return postArray;
}

async function getFacets() {
  const facetArray = [];
  const facets = await fetchQueryIndex()
    .sheet('blogs')
    .all();
  const tagJson = {};
  facets.forEach((facet) => {
    const tags = facet.tags.split(',');
    tags.forEach((tag) => {
      const cleanTag = tag.trim().replaceAll(/["[\]]/g, '');
      // toss out blog tags and empty ones
      if (cleanTag === 'Blogs' || cleanTag === '') {
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

const formatDate = (date) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: '2-digit',
});

function getLocale() {
  const locale = getMetadata('locale');
  if (locale && locale.length > 0) {
    return locale;
  }
  // defaulting to en-us
  return 'en-us';
}

function toggleFacets() {
  const facets = document.querySelector('div.blog-filter-container > div.facet > ul');
  facets.style.display = facets.style.display === 'none' ? 'unset' : 'none';
}

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
    const categoryLink = document.createElement('a');
    const dateDiv = document.createElement('div');
    categoryLink.href = window.location.pathname;
    categoryLink.innerText = 'Blogs';
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

async function updateResults(checkboxChange) {
  const postArray = [];
  const posts = await fetchQueryIndex().sheet('blogs')
    .map((post) => ({
      tags: post.tags.split(',').map((tag) => tag.trim().replaceAll(/["[\]]/g, '')),
      title: post.title, // Include the title
      date: post.date, // Include the date
      image: post.image, // Include the image
    }))
    .filter((post) => filterTags(checkboxChange, post.tags.includes(checkboxChange.value)))
    .limit(10)
    .all();
  posts.forEach((post) => {
    postArray.push(post);
  });
  const bfc = document.querySelector('div.blog-filter-container> div.results> ul');
  bfc.innerHTML = '';
  decorateResults(postArray, bfc);

  const checkboxes = document.querySelectorAll('div.blog-filter-container div.facet input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    if (checkbox.value !== checkboxChange.value) {
      checkbox.checked = false;
    }
  });
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
  const facets = await getFacets();
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
    // create a listener for the checkbox
    checkbox.addEventListener('change', (cb) => {
      updateResults(cb.target);
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
  const posts = await getResults();
  decorateResults(posts, resultsList);
  resultsDiv.append(resultsList);
  const blogFilterContainer = document.createElement('div');
  blogFilterContainer.classList.add('blog-filter-container');
  blogFilterContainer.append(facetDiv, resultsDiv);
  block.replaceWith(blogFilterContainer);
}

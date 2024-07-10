import ffetch from '../../scripts/ffetch.js';
import { getDateFromExcel } from '../../scripts/scripts.js';

async function getResults() {
  const postArray = [];
  const posts = await ffetch('/query-index.json').sheet('blog')
    .limit(10).all();
  posts.forEach((post) => {
    postArray.push(post);
  });
  return postArray;
}

async function getFacets() {
  const facetArray = [];
  const facets = await ffetch('/query-index.json')
    .sheet('blog')
    .all();
  const tagJson = {};
  facets.forEach((facet) => {
    const tags = facet.tags.split(',');
    tags.forEach((tag) => {
      const cleanTag = tag.trim().replaceAll(/["\[\]]/g, '');
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

export default async function decorate(block) {
  const facets = await getFacets();
  const facetDiv = document.createElement('div');
  facetDiv.classList.add('facet');
  const facetList = document.createElement('ul');
  const facetLI = document.createElement('li');
  const topicHead = document.createElement('div');
  topicHead.innerText = 'TOPIC';
  facetLI.append(topicHead);
  facetList.append(facetLI);
  const facetUL = document.createElement('ul');
  facetList.append(facetUL);
  facets.tags.forEach((facet) => {
    const facetItem = document.createElement('li');
    const topic = document.createElement('div');
    const checkbox = document.createElement('input');
    const span = document.createElement('span');
    span.innerText = `${facet.tag} (${facet.count})`;
    checkbox.type = 'checkbox';
    checkbox.value = facet.tag;
    topic.append(checkbox);
    topic.append(span);
    facetItem.append(topic);
    facetUL.append(facetItem);
  });
  facetDiv.append(facetList);
  const resultsDiv = document.createElement('div');
  resultsDiv.classList.add('results');
  const resultsList = document.createElement('ul');
  const posts = await getResults();
  posts.forEach((post) => {
    const item = document.createElement('li');
    item.classList.add('list-item');
    const itemLeft = document.createElement('div');
    itemLeft.classList.add('item-left');
    const itemRight = document.createElement('div');
    itemRight.classList.add('item-right');
    const heading = document.createElement('h4');
    const categoryDiv = document.createElement('div');
    const categoryLink = document.createElement('a');
    const dateDiv = document.createElement('div');
    categoryLink.href = window.location.pathname;
    categoryLink.innerText = 'Blogs';
    categoryDiv.append(categoryLink);
    heading.classList.add('item-title');
    heading.innerText = post.title;
    dateDiv.classList.add('item-date');
    dateDiv.innerText = formatDate(getDateFromExcel(post.date));
    const image = document.createElement('img');
    itemLeft.append(image);
    image.src = post.image;
    item.append(itemLeft);
    itemRight.append(heading, categoryDiv, dateDiv);
    item.append(itemRight);
    resultsList.append(item);
  });
  resultsDiv.append(resultsList);
  const blogFilterContainer = document.createElement('div');
  blogFilterContainer.classList.add('blog-filter-container');
  blogFilterContainer.append(facetDiv, resultsDiv);
  block.replaceWith(blogFilterContainer);
}

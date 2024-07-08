import ffetch from '../../scripts/ffetch.js';
import { getDateFromExcel } from '../../scripts/scripts.js';

async function getResults() {
  const postArray = [];
  const posts = await ffetch('/query-index.json').sheet('blog').all();

  posts.forEach((post) => {
    postArray.push(post);
  });
  return postArray;
}

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });
};

export default async function decorate(block) {
  const facetDiv = document.createElement('div');
  facetDiv.classList.add('facet');
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

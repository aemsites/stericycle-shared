import { getRelatedPosts } from '../../scripts/scripts.js';
import { createOptimizedPicture, decorateButtons, readBlockConfig } from '../../scripts/aem.js';

function createPostLink(post) {
  const anchor = document.createElement('a');
  if (post) {
    anchor.setAttribute('aria-label', post.title);
    anchor.href = post.path;
  }
  return anchor;
}

function addPost(list, post, isLoading) {
  // create teaser
  const teaser = document.createElement('li');
  teaser.classList.add('teaser');
  if (isLoading) {
    teaser.classList.add('loading');
  }
  list.append(teaser);

  // create thumbnail
  const thumbnailLink = createPostLink(post);
  teaser.append(thumbnailLink);
  let thumbnail;
  if (isLoading) {
    thumbnail = document.createElement('div');
  } else {
    thumbnail = createOptimizedPicture(post.image, post.title);
  }
  thumbnail.classList.add('teaser-thumbnail');
  thumbnailLink.append(thumbnail);

  // create content
  const content = document.createElement('div');
  content.classList.add('teaser-content');
  teaser.append(content);
  if (isLoading) {
    return;
  }
  const title = createPostLink(post);
  title.classList.add('teaser-title');
  title.textContent = post?.title;
  content.append(title);
  const category = document.createElement('a');
  category.classList.add('teaser-category');
  const mediaType = post['media-type'];
  category.setAttribute('aria-label', mediaType);
  category.href = '#'; // TODO: category url from index
  category.textContent = mediaType;
  content.append(category);
  const buttonWrapper = document.createElement('p');
  content.append(buttonWrapper);
  const button = createPostLink(post);
  button.textContent = 'Read More';
  buttonWrapper.append(button);
  decorateButtons(buttonWrapper);
}

export default function decorate(block) {
  const { type, columns } = readBlockConfig(block);
  let columnCount = parseInt(columns, 10);
  if (Number.isNaN(columnCount)) {
    columnCount = 4;
  }
  block.innerHTML = '';

  // create wrapper
  const list = document.createElement('ul');
  list.classList.add('teaser-list');
  block.append(list);

  // populate with dummies while loading
  for (let i = 0; i < columnCount; i += 1) {
    addPost(list, null, true);
  }

  getRelatedPosts((type || '').split(/,\s*]/), type, columnCount).then((posts) => {
    list.innerHTML = '';
    posts.forEach((post) => {
      addPost(list, post, false);
    });
  });
}
import { getRelatedPosts } from '../../scripts/scripts.js';
import { createOptimizedPicture, decorateButtons, readBlockConfig } from '../../scripts/aem.js';

function createPostLink(post) {
  const anchor = document.createElement('a');
  anchor.setAttribute('aria-label', post.title);
  anchor.href = post.path;
  return anchor;
}

export default function decorate(block) {
  const { type } = readBlockConfig(block);
  block.innerHTML = '';
  getRelatedPosts((type || '').split(/,\s*]/), type, 4).then((posts) => {
    const list = document.createElement('ul');
    list.classList.add('teaser-list');
    posts.forEach((post) => {
      // create teaser
      const teaser = document.createElement('li');
      teaser.classList.add('teaser');
      list.append(teaser);

      // create thumbnail
      const thumbnailLink = createPostLink(post);
      teaser.append(thumbnailLink);
      const thumbnail = createOptimizedPicture(post.image, post.title);
      thumbnail.classList.add('teaser-thumbnail');
      thumbnailLink.append(thumbnail);

      // create content
      const content = document.createElement('div');
      content.classList.add('teaser-content');
      teaser.append(content);
      const title = createPostLink(post);
      title.classList.add('teaser-title');
      title.textContent = post.title;
      content.append(title);
      const category = document.createElement('a');
      category.classList.add('teaser-category');
      category.setAttribute('aria-label', post['media-type']);
      category.href = '#'; // TODO: category url from index
      category.textContent = post['media-type'];
      content.append(category);
      const buttonWrapper = document.createElement('p');
      content.append(buttonWrapper);
      const button = createPostLink(post);
      button.textContent = 'Read More';
      buttonWrapper.append(button);
      decorateButtons(buttonWrapper);
    });
    block.append(list);
  });
}

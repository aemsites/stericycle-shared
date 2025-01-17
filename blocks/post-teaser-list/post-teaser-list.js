// eslint-disable-next-line import/no-cycle
import {
  createPostLink,
  formatDate,
  getDateFromExcel,
  getRelatedPosts,
} from '../../scripts/scripts.js';
import {
  createOptimizedPicture,
  decorateButtons,
  decorateIcon,
  readBlockConfig,
} from '../../scripts/aem.js';

/**
 * Add a post to the list
 * @param {HTMLElement} list
 * @param {string} ctaType
 * @param {object} post
 * @param {boolean} isLoading
 * @returns {void}
 *
*/
function addPost(list, ctaType, post, isLoading) {
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

  const eyebrowWrapper = document.createElement('div');

  eyebrowWrapper.classList.add('teaser-eyebrow-wrapper');

  // category
  const category = document.createElement('a');
  const mediaType = post['media-type'];

  category.classList.add('teaser-category');
  category.classList.add('eyebrow-small');
  category.setAttribute('aria-label', mediaType);

  // Fix type to be non-plural and lowercase
  const type = mediaType.toLowerCase().replaceAll(' ', '-').slice(0, -1);
  category.href = post.path.substring(
    0,
    post.path.indexOf('/', post.path.indexOf(type) + type.length),
  );

  category.textContent = mediaType;

  eyebrowWrapper.append(category);

  // date
  const dateAnchor = document.createElement('a');

  dateAnchor.href = post.path;

  const dateSpan = document.createElement('span');

  dateSpan.classList.add('teaser-date');
  dateSpan.textContent = formatDate(getDateFromExcel(post.date));

  dateAnchor.append(dateSpan);
  eyebrowWrapper.append(dateAnchor);

  content.append(eyebrowWrapper);

  // title
  content.append(title);

  // ctas
  const button = createPostLink(post);
  const icon = document.createElement('span');

  icon.classList.add('icon', 'icon-right-arrow');
  button.textContent = 'Read More';

  const ctasWrapper = document.createElement('p');
  let buttonWrapper = document.createElement('div');

  if (ctaType === 'primary') {
    buttonWrapper = document.createElement('strong');
  }

  if (ctaType === 'secondary') {
    buttonWrapper = document.createElement('em');
  }

  button.appendChild(icon);
  buttonWrapper.appendChild(button);
  ctasWrapper.appendChild(buttonWrapper);
  content.appendChild(ctasWrapper);

  decorateButtons(buttonWrapper);
  decorateIcon(icon);
}

export default function decorate(block) {
  const { type, columns, cta } = readBlockConfig(block);

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
    addPost(list, cta, null, true);
  }

  getRelatedPosts((type || '').split(/,\s*]/), type, columnCount).then(
    (posts) => {
      list.innerHTML = ''; // Clear dummies
      posts.forEach((post) => addPost(list, cta, post, false));
    },
  );
}

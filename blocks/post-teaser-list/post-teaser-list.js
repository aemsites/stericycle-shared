import { getLatestPosts } from '../../scripts/scripts.js';
import { decorateButtons } from '../../scripts/aem.js';

function createPostLink(post) {
  const anchor = document.createElement('a');
  anchor.setAttribute('aria-label', post.title);
  anchor.href = post.path;
  return anchor;
}

export default function decorate(block) {
  getLatestPosts('Blogs', 4).then((posts) => {
    console.log(posts);
    const list = document.createElement('ul');
    list.classList.add('teaser-list');
    posts.forEach((post) => {
      // const teaserLink = document.createElement('a');
      // const teaserDiv = document.createElement('div');
      // const teaserDate = document.createElement('div');
      // teaserDate.className = 'related-content-date';
      // const teaserTitle = document.createElement('h5');
      // teaserTitle.innerText = post.title;
      // const pDate = getDateFromExcel(post.date);
      // const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      // teaserDate.innerText = `${months[pDate.getMonth()]} ${pDate.getDate() + 1}, ${pDate.getFullYear()}`;
      // const teaserPicture = document.createElement('picture');
      // teaserDiv.append(teaserPicture);
      // teaserDiv.append(teaserTitle);
      // teaserDiv.append(teaserDate);
      // const teaserImg = document.createElement('img');
      // teaserImg.src = post.image;
      // teaserImg.alt = post.title;
      // teaserPicture.append(teaserImg);
      // teaserLink.setAttribute('aria-label', post.title);
      // teaserLink.append(teaserDiv);
      // teaser.append(teaserLink);
      // teaserLink.href = post.path;
      // teaser.className = 'related-content-teaser';

      // create teaser
      const teaser = document.createElement('li');
      teaser.classList.add('teaser');
      list.append(teaser);

      // create thumbnail
      const thumbnailLink = createPostLink(post);
      teaser.append(thumbnailLink);
      const thumbnail = document.createElement('img');
      thumbnail.src = post.image;
      thumbnail.alt = post.title;
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

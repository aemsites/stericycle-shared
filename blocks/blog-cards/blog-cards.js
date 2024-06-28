import { getDateFromExcel, getRelatedBlogContent } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const latestPosts = document.createElement('div');
  latestPosts.classList.add('latest-posts');
  const blogTeasers = document.createElement('ul');
  const posts = await getRelatedBlogContent(undefined, 4);

  posts.forEach((post) => {
    const teaser = document.createElement('li');
    const teaserDiv = document.createElement('div');
    teaserDiv.className = 'blog-teaser-card';
    const teaserBlog = document.createElement('div');
    teaserBlog.className = 'blog-link';
    const teaserTitle = document.createElement('h5');
    teaserTitle.innerText = post.title;
    teaserBlog.innerHTML = '<a href="#">BLOGS</a>';
    const teaserPicture = document.createElement('picture');
    teaserDiv.append(teaserPicture);
    teaserDiv.append(teaserTitle);
    teaserDiv.append(teaserBlog);
    const teaserImg = document.createElement('img');
    teaserImg.src = post.image;
    teaserImg.alt = post.title;
    teaserPicture.append(teaserImg);
    teaser.append(teaserDiv);
    teaser.className = 'related-content-teaser';
    const readMeButton = document.createElement('p');
    readMeButton.className = 'button-container';
    const boldText = document.createElement('strong');
    const buttonLink = document.createElement('a');
    buttonLink.href = post.path;
    buttonLink.title = post.title;
    buttonLink.innerText = 'Read More';
    buttonLink.classList.add('button', 'secondary');
    boldText.append(buttonLink);
    readMeButton.append(boldText);
    teaserDiv.append(readMeButton);

    blogTeasers.append(teaser);
  });
  latestPosts.append(blogTeasers);
  block.replaceWith(latestPosts);
}

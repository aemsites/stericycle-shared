import { createOptimizedPicture, fetchPlaceholders, getMetadata, readBlockConfig } from '../../scripts/aem.js';
import { getLocale, getRelatedPosts } from '../../scripts/scripts.js';
import { a, div, domEl, h4, p } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const type = getMetadata('media-type');
  const cfg = readBlockConfig(block);
  const count = parseInt(cfg.items, 10) + 1 || 5;

  let related = await getRelatedPosts([type], [], count);
  const header = div({ class: 'related-content-header' }, h4(ph.relatedcontent));

  const list = div({ class: 'related-content-list' });
  related = related.filter((post) => post.path !== window.location.pathname);
  related.slice(0, related.length - (related.length % 2)) // (Only even amount)
    .forEach((post) => {
      const picture = createOptimizedPicture(post.image, post.title);
      const date = new Date(post.date * 1000);
      const formatter = new Intl.DateTimeFormat(getLocale(), { month: 'long', day: 'numeric', year: 'numeric' });
      const item = div(
        { class: 'related-content-item' },
        a(
          { href: post.path, 'aria-label': post.title },
          picture,
          domEl('h5', post.title),
          p({ class: 'media-type' }, post['media-type']),
          p({ class: 'pub-date' }, `${formatter.format(date)}`),
        ),
      );
      list.append(item);
    });
  block.replaceChildren(header, list);
}

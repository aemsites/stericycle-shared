import { domEl, a, div, img } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  block.content = '';
  let locale = window.location.pathname.split('/')[1];
  locale = locale.match(/^[a-z]{2}-[a-z]{2}$/) ? locale : 'en-us'; // default to us-en if no locale in path

  // @formatter:off
  /* eslint-disable function-paren-newline,function-call-argument-newline */
  const nav = domEl('nav', { id: 'nav', class: 'alt-0-nav'},
    div({ class: 'logo' },
      a({ href: `/${locale}`, class: 'logo-link', title: 'Shred-it' },
        img({
          src: '/icons/shred-it-logo-white.svg',
          alt: 'Paper Shredding & Document Destruction Services Near You. ',
        }),
      ),
    ),
  );
  /* eslint-enable function-paren-newline,function-call-argument-newline */
  // @formatter:on

  block.replaceChildren(nav);
}

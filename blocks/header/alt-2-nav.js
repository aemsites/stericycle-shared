import { domEl, a, div, img, li } from '../../scripts/dom-helpers.js';
import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getLocale } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  block.content = '';
  let locale = window.location.pathname.split('/')[1];
  locale = locale.match(/^[a-z]{2}-[a-z]{2}$/) ? locale : 'en-us'; // default to us-en if no locale in path

  const navMeta = new URL(getMetadata('nav'), window.location).pathname;
  const fragment = await loadFragment(navMeta);
  const navSections = fragment.querySelector('.section[data-section="sections" i]');
  navSections.replaceChildren(navSections.querySelector('ul'));
  navSections.classList.add('nav-sections');
  const navContact = fragment.querySelector('.section[data-section="contact" i]');
  navContact.replaceChildren(navContact.querySelector('ul'));
  navContact.classList.add('nav-contact');
  const navModalPath = getMetadata('nav-modal-path') || ph.navmodalpath || '/forms/modals/modal';
  const modalButtonTitle = ph.getaquote || 'Get a Quote';
  const link = li(
    { class: 'quote-link' },
    a({ href: navModalPath, class: 'quote-button button primary', 'aria-label': modalButtonTitle }, modalButtonTitle),
  );
  navContact.querySelector('ul').append(link);

  // @formatter:off
  /* eslint-disable function-paren-newline,function-call-argument-newline */
  const nav = domEl('nav', { id: 'nav' },
    div({ class: 'logo' },
      a({ href: `/${locale}`, class: 'logo-link', title: 'Shred-it' },
        img({
          src: `/icons/shredit-logo-${locale}.svg`,
          alt: 'Paper Shredding & Document Destruction Services Near You. ',
        }),
      ),
    ),
    navSections,
    navContact,
  );
  /* eslint-enable function-paren-newline,function-call-argument-newline */
  // @formatter:on

  // Fix the bookmarks.
  nav.querySelectorAll('.nav-sections [href^="bookmark://"]').forEach((el) => {
    el.href = el.href.replace('bookmark://', '#');
    el.removeAttribute('target');
  });

  const servicesA = getMetadata('services-link');
  const whyShreditA = getMetadata('why-shred-it-link');
  const whyShredA = getMetadata('why-shred-link');

  navSections?.querySelectorAll('ul li').forEach((x, index) => {
    if (index === 0) {
      x.querySelector('a').href = servicesA;
    } else if (index === 1) {
      x.querySelector('a').href = whyShreditA;
    } else {
      x.querySelector('a').href = whyShredA;
    }
  });

  // If the first section contains a Logo, assume that we need to only display menu when scrolling.

  const found = document.querySelector('main > div.section:first-of-type span.icon[class*="logo"]');
  if (found) {
    document.documentElement.style.setProperty('--nav-height', '0');
    block.classList.add('scroll-menu', 'hidden');

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        document.documentElement.style.setProperty('--nav-height', '0');
        block.classList.toggle('hidden', true);
      } else {
        let height = '150px';
        if (window.matchMedia('(min-width: 900px)').matches) {
          height = '76px';
        } else if (window.matchMedia('(min-width: 600px)').matches) {
          height = '130px';
        }
        document.documentElement.style.setProperty('--nav-height', height);
        block.classList.toggle('hidden', false);
      }
    });
    observer.observe(document.querySelector('main > div.section'));
  }

  block.replaceChildren(nav);
}

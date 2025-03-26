import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { button, span } from '../../scripts/dom-helpers.js';
import { loadFragment } from '../fragment/fragment.js';
import {
  addMenuFunctionality,
  buildCompanyLogo,
  buildCtasSection,
  generateMenuFromSection,
} from './utils.js';
import { getFloatingContact, getLocale } from '../../scripts/scripts.js';

const TEXT_ELEMENTS = [
  'a',
  'strong',
  'p',
  'span',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // Fetching
  const placeHolders = await fetchPlaceholders(`/${getLocale()}`);

  block.textContent = '';

  let locale = window.location.pathname.split('/')[1] || 'en-us';
  locale = locale.match(/^[a-z]{2}-[a-z]{2}$/) ? locale : 'en-us'; // default to us-en if no locale in path

  const navMeta = getMetadata('navigation-refresh');
  const navPath = navMeta
    ? new URL(navMeta, window.location).pathname
    : `/${locale}/navigation-refresh`;
  const fragment = await loadFragment(navPath);

  // logo
  const logo = buildCompanyLogo();

  if (logo) {
    block.append(logo);
  }

  // tools
  const navTools = fragment.querySelector('.section[data-section="Ctas" i]');
  const navToolsLinks = navTools.querySelectorAll(TEXT_ELEMENTS);

  const toolsMap = {};

  navToolsLinks.forEach((link) => {
    toolsMap[link?.textContent] = {
      href: link?.getAttribute('href'),
      text: link?.textContent,
    };
  });

  // contact data
  const contactData = fragment.querySelector(
    '.section[data-section="Contact" i]',
  );
  const contactDataLinks = contactData.querySelectorAll(TEXT_ELEMENTS);

  const contactMap = {};

  contactDataLinks.forEach((link) => {
    const [key, text] = link && link.textContent.split('#');
    const field = key?.toLowerCase()?.split(' ')?.join('');

    contactMap[field] = {
      href: link?.getAttribute('href'),
      text,
    };
  });

  // location data
  const locations = fragment.querySelector(
    '.section[data-section="Location" i]',
  );

  const locationDataMap = {};

  locations.querySelectorAll(TEXT_ELEMENTS).forEach((link) => {
    const [key, text] = link && link.textContent.split('#');
    const field = key?.toLowerCase()?.split(' ')?.join('');

    locationDataMap[field] = {
      href: link?.getAttribute('href'),
      text,
    };
  });

  // Parsing
  const sectionElement = fragment.querySelector('[data-section="Sections"]');
  const instructions = fragment.querySelector('[data-section="Instructions"]');

  const navigationMenu = generateMenuFromSection(
    sectionElement,
    locationDataMap,
    instructions,
    locale,
  );

  if (navigationMenu) {
    block.append(navigationMenu);
    block.append(await getFloatingContact());
  }

  // Ctas
  const { ctas, ctasMobile } = buildCtasSection(
    locale,
    placeHolders,
    toolsMap,
    contactMap,
  );

  if (ctas) {
    block.append(ctas);
  }

  // Mobile Ctas
  if (ctasMobile) {
    const nav = block.querySelector('nav');

    nav.append(ctasMobile);
  }

  // Hamburguer
  const hamburger = button(
    {
      class: 'hamburger-menu',
      'aria-label': 'Toggle navigation',
      'aria-expanded': 'false',
      tabindex: '0',
      role: 'button',
      'aria-controls': 'nav',
    },
    span(),
    span(),
    span(),
  );

  block.appendChild(hamburger);

  // Menu functionality
  addMenuFunctionality(ctasMobile);
}

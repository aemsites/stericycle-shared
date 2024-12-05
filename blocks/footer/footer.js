import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { a, p } from '../../scripts/dom-helpers.js';
import { getLocale } from '../../scripts/scripts.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 992px)');

/**
 * loads and decorates the footer
 * @param {Element} footer The footer element
 */
function createMenuAccordion(footer) {
  footer.forEach((menu) => {
    const menuListItems = menu.querySelectorAll(':scope > li');
    // iterate the nodelist of li elements
    menuListItems.forEach((item) => {
      item.classList.add('footer-accordion');
      // wrap the first link in a wrapper span
      const itemTitle = item.childNodes[0];
      // remove the first text inside the li
      item.childNodes[0].remove();
      const footerAccordionLinkWrapper = document.createElement('span');
      footerAccordionLinkWrapper.classList.add('footer-accordion-link-wrapper');
      footerAccordionLinkWrapper.append(itemTitle);
      item.prepend(footerAccordionLinkWrapper);
      const footerAccordionContentWrapper = document.createElement('div');
      footerAccordionContentWrapper.classList.add('footer-accordion-content-wrapper');
      const footerAccordionContentInnerWrapper = document.createElement('div');
      footerAccordionContentInnerWrapper.classList.add('footer-accordion-content-inner-wrapper');
      footerAccordionContentWrapper.append(footerAccordionContentInnerWrapper);

      // if there is accordion content, create a button to exand/collapse
      const accordionContent = item.querySelector(':scope > ul');
      if (accordionContent) {
        accordionContent.classList.add('footer-accordion-content');
        const accordionButton = document.createElement('button');
        accordionButton.classList.add('footer-accordion-button');
        accordionButton.innerHTML = '<span class="footer-accordion-button-icon">+</span>';
        footerAccordionLinkWrapper.append(accordionButton);

        // attach the event handler for the new button
        footerAccordionLinkWrapper.addEventListener('click', () => {
          if (!isDesktop.matches) {
            if (footerAccordionContentWrapper.style.height) {
              footerAccordionContentWrapper.style.height = null;
              footerAccordionContentWrapper.setAttribute('aria-hidden', true);
              footerAccordionContentWrapper.classList.remove('active');
              footerAccordionLinkWrapper.classList.remove('active');
              footerAccordionLinkWrapper.querySelector('.footer-accordion-button-icon').textContent = '+';
            } else {
              footerAccordionContentWrapper.setAttribute('aria-hidden', false);
              footerAccordionContentWrapper.classList.add('active');
              footerAccordionLinkWrapper.classList.add('active');
              footerAccordionContentWrapper.style.height = `${accordionContent.scrollHeight + 40}px`;
              footerAccordionLinkWrapper.querySelector('.footer-accordion-button-icon').textContent = '-';
            }
          }
        });

        // wrap the accordion content in footerAccordionContentWrapper
        item.insertBefore(footerAccordionContentWrapper, accordionContent);
        footerAccordionContentInnerWrapper.append(accordionContent);
      }
    });
  });
}

/**
 * @param fragment
 * @param footerPath
 * @param locale
 * Creates the modal trigger button in footer
 */
async function createModalButton(fragment, footerPath, locale) {
  const ph = await fetchPlaceholders(`/${getLocale()}`);
  const footerModalPath = getMetadata('footer-modal-path') || '/forms/modals/modal';
  const modalButtonTitle = ph.requestafreequote || 'Request a Free Quote';
  const btn = p(
    { class: 'button-container quote-wrapper' },
    a({
      href: footerModalPath,
      class: 'quote-button button primary',
      'aria-label': modalButtonTitle,
    }, modalButtonTitle),
  );
  if (footerPath.includes('alt-0-footer')) {
    const parentWrapper = fragment.querySelector('.default-content-wrapper');
    parentWrapper.children[2]?.insertAdjacentElement('beforebegin', btn);
  } else if (footerPath === `/${locale}/footer`) {
    btn.querySelector('a').textContent = ph.getaquote || 'Get a Quote';
    const parentWrapper = fragment.querySelector('.columns.quote > div > div');
    parentWrapper.children[0]?.insertAdjacentElement('beforebegin', btn);
  }
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const locale = window.location.pathname.split('/')[1] || 'en-us'; // default to us-en if no locale in path
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const navMeta = getMetadata('nav');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `/${locale}/footer`;
  const fragment = await loadFragment(footerPath);
  createModalButton(fragment, footerPath, locale);
  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  if (navMeta === '/en-us/alt-0-nav' || navMeta === '/en-us/alt-1-nav') {
    block.classList.add('narrow');
  }
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  // Select all <ul> elements within the .default-content-wrapper
  const ulElements = block.querySelectorAll('.default-content-wrapper > ul');

  // Loop through each <ul> element and add a unique class
  ulElements.forEach((ul, index) => {
    // Create a unique class name
    const numOfLis = ul.querySelectorAll('li').length;
    const accordionContainer = numOfLis > 10 ? 'footer-accordion-container' : `footer-ul-${index + 1}`;
    // const uniqueClassName = `footer-ul-${index + 1}`;
    // Add the unique class to the <ul> element
    ul.classList.add(accordionContainer);
  });
  const accordionsContainer = block.querySelectorAll('.footer-accordion-container');
  createMenuAccordion(accordionsContainer);
  // Insert the columns-wrapper div inside the default-content-wrapper
  const columnsWrapper = block.querySelector('.columns-wrapper');
  if (block.querySelector('.default-content-wrapper > .footer-accordion-container')) {
    block.querySelector('.default-content-wrapper > .footer-accordion-container').insertAdjacentElement('afterend', columnsWrapper);
  }
}

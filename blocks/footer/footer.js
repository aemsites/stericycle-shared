import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

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
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const locale = window.location.pathname.split('/')[1] || 'en-us'; // default to us-en if no locale in path
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : `/${locale}/footer`;
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  fragment.querySelector('.section.breadcrumb-container')?.remove(); // remove auto-block breadcrumb
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

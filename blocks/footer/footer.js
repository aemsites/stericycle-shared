import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { buildBreadcrumb, buildCompanyLogo, createCountrySelector, createMenuAccordion, createModalButton } from './utils.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const locale = getMetadata('locale') || 'en-us';
  // load footer as fragment
  const footerMeta = getMetadata('footer')?.toLowerCase();
  const navMeta = getMetadata('nav');
  const footerWidth = getMetadata('footer-width');

  const footerPath = footerMeta && footerMeta.includes('alt-0-footer') ? `/${locale}/alt-0-footer-refresh` : `/${locale}/footer-refresh`;
  const fragment = await loadFragment(footerPath);
  await createModalButton(fragment, footerPath, locale);
  // get url for current page
  const url = window.location.href;
  // build breadcrumb
  const breadcrumb = buildBreadcrumb(url);
  const breadcrumbElement = fragment.querySelector('.section.footer-breadcrumb');
  if (breadcrumbElement) {
    breadcrumbElement.innerHTML = breadcrumb;
  }
  // build company logo
  const companyLogo = fragment.querySelector('.section.footer-socials .default-content-wrapper');
  if (companyLogo) {
    const logo = buildCompanyLogo();
    companyLogo.prepend(logo);
  }
  // Build country selector
  const countrySelector = fragment.querySelector('.section.footer-countries');
  const countryListItems = fragment.querySelectorAll('.section.footer-countries ul li ul li');
  const countryListTitle = fragment.querySelector('.section.footer-countries > .default-content-wrapper > ul > li');

  if (countryListItems.length > 0) {
    countrySelector.textContent = '';
    const countries = createCountrySelector(countryListItems, countryListTitle);
    countrySelector.append(countries);
  }
  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  footer.classList.add('footer-container');
  if (navMeta === '/en-us/alt-0-nav' || navMeta === '/en-us/alt-1-nav') {
    block.classList.add('narrow');
  }
  if (footerWidth === 'wide') {
    footer.classList.add('wide');
  }
  while (fragment?.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  // Select all <ul> elements within the .default-content-wrapper
  const ulElements = block.querySelectorAll('.section.footer-menu .default-content-wrapper > ul');

  // Loop through each <ul> element and add a unique class
  ulElements.forEach((ul, index) => {
    // Create a unique class name
    const numOfLis = ul.querySelectorAll('li').length;
    const accordionContainer = numOfLis > 10 ? 'footer-accordion-container' : `footer-ul-${index + 1}`;
    // Add the unique class to the <ul> element
    ul.classList.add(accordionContainer);
  });
  const accordionsContainer = block.querySelectorAll('.section.footer-menu .footer-accordion-container');
  createMenuAccordion(accordionsContainer);
  // Insert the columns-wrapper div inside the default-content-wrapper
  // const columnsWrapper = block.querySelector('.columns-wrapper');
  if (block.querySelector('.default-content-wrapper > .footer-accordion-container')) {
    block.querySelector('.default-content-wrapper > .footer-accordion-container');
    // block.querySelector('.default-content-wrapper > .footer-accordion-container').insertAdjacentElement('afterend', columnsWrapper);
  }

  // Prevent logo from turning into button
  block.querySelectorAll('a:has(.icon-shredit-logo)').forEach((logo) => {
    logo.classList.remove('button', 'cmp-linkcalltoaction');
  });
}

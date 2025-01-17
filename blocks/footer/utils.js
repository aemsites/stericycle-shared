import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import { a, p } from '../../scripts/dom-helpers.js';
import { getLocale } from '../../scripts/scripts.js';
import { countryData, isDesktop } from './constants.js';

/**
 * loads and decorates the footer
 * @param {Element} footer The footer element
 */
export function createMenuAccordion(footer) {
  footer.forEach((menu) => {
    const menuListItems = menu.querySelectorAll(':scope > li');
    menuListItems.forEach((item) => {
      item.classList.add('footer-accordion');
      const itemTitle = item.childNodes[0];
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
        accordionButton.innerHTML = '<span class="footer-accordion-button-icon"><img data-icon-name="home-white" src="/icons/plus-sign.svg" alt="" loading="lazy"></span>';
        footerAccordionLinkWrapper.append(accordionButton);
        footerAccordionLinkWrapper.addEventListener('click', () => {
          if (!isDesktop.matches) {
            if (footerAccordionContentWrapper.style.height) {
              footerAccordionContentWrapper.style.height = null;
              footerAccordionContentWrapper.setAttribute('aria-hidden', true);
              footerAccordionContentWrapper.classList.remove('active');
              footerAccordionLinkWrapper.classList.remove('active');
              const plusSign = '<img data-icon-name="home-white" src="/icons/plus-sign.svg" alt="" loading="lazy">';
              footerAccordionLinkWrapper.querySelector('.footer-accordion-button-icon').innerHTML = plusSign;
            } else {
              footerAccordionContentWrapper.setAttribute('aria-hidden', false);
              footerAccordionContentWrapper.classList.add('active');
              footerAccordionLinkWrapper.classList.add('active');
              footerAccordionContentWrapper.style.height = `${accordionContent.scrollHeight + 40}px`;
              const minusSign = '<img data-icon-name="home-white" src="/icons/minus-sign.svg" alt="" loading="lazy">';
              footerAccordionLinkWrapper.querySelector('.footer-accordion-button-icon').innerHTML = minusSign;
            }
          }
        });
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
export async function createModalButton(fragment, footerPath, locale) {
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
    parentWrapper.append(btn);
  } else if (footerPath === `/${locale}/footer-refresh`) {
    btn.querySelector('a').textContent = ph.getaquote || 'Get a Quote';
    const parentWrappers = fragment.querySelectorAll('.columns.quote > div > div');
    const parentWrapper = parentWrappers[parentWrappers.length - 1];
    if (parentWrapper) {
      parentWrapper.append(btn);
    }
  }
}

/**
 * Function to build the breadcrumb element.
 * @returns {HTMLElement} - The breadcrumb element.
 */
export function buildBreadcrumb(url) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter((segment) => segment);
  const languageSegment = pathSegments[0]?.match(/^[a-z]{2}-[a-z]{2}$/) ? pathSegments[0] : '';
  const homeHref = languageSegment ? `/${languageSegment}` : '/';
  const homeIcon = `<a href="${homeHref}"><span class="icon icon-home"></span></a>`;
  const breadcrumbLabels = pathSegments.filter((segment) => segment !== languageSegment)
    .map((segment) => segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()));
  const breadcrumb = [homeIcon];
  let currentPath = languageSegment ? `/${languageSegment}` : '';

  breadcrumbLabels.forEach((label, index) => {
    currentPath += `/${pathSegments[index + (languageSegment ? 1 : 0)]}`;
    if (index === breadcrumbLabels.length - 1) {
      const lastSegment = document.createElement('span');
      lastSegment.textContent = label;
      breadcrumb.push(lastSegment.outerHTML);
    } else {
      breadcrumb.push(`<a href="${currentPath}">${label}</a>`);
    }
  });

  if (breadcrumbLabels.length === 0) {
    const lastSegment = document.createElement('span');
    lastSegment.textContent = 'Home';
    breadcrumb.push(lastSegment.outerHTML);
  }

  const separator = '<span class="icon icon-chevron-right"></span>';
  const breadcrumbDiv = document.createElement('div');
  breadcrumbDiv.className = 'default-content-wrapper';
  breadcrumbDiv.innerHTML = breadcrumb.join(separator);
  return breadcrumbDiv.outerHTML;
}
/**
 * Function to build the company logo element.
 * @returns {HTMLElement} - The company logo element.
 */
export function buildCompanyLogo() {
  const logo = document.createElement('div');
  const logoLink = document.createElement('a');
  const logoImg = document.createElement('img');
  logoImg.src = '/icons/shredit-logo.svg';
  logoImg.alt = 'Shredit Logo';

  logoLink.appendChild(logoImg);
  logo.appendChild(logoLink);

  logoLink.href = '/';
  logoLink.className = 'logo-link';
  logoLink['aria-label'] = 'Shredit Home';
  logo.className = 'logo';

  return logo;
}

/**
 * Function to build the country selector element.
 * @returns {HTMLElement} - The country selector element.
 */
export function createCountrySelector(countryListItems, countryListTitle) {
  const currentUrl = window.location.href;

  const currentCountry = countryData.find((country) => currentUrl.includes(new URL(country.url, window.location.origin).pathname))
    || countryData.find((country) => country.name === 'United States');

  const title = countryListTitle?.firstChild?.nodeValue.trim() || 'Country:';
  const label = document.createElement('label');
  label.setAttribute('for', 'country-selector');
  label.textContent = title;

  const select = document.createElement('select');
  select.id = 'country-selector';
  select.className = 'custom-icon';

  countryListItems.forEach((item) => {
    const countryName = item.textContent.trim();
    const countryDataMatch = countryData.find((country) => country.name === countryName);
    const option = document.createElement('option');
    option.value = countryDataMatch ? countryDataMatch.url : '';
    option.textContent = countryName;
    if (countryDataMatch === currentCountry) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', (event) => {
    const selectedUrl = event.target.value;
    if (selectedUrl) {
      window.location.href = selectedUrl;
    }
  });
  const countrySelector = document.createElement('div');
  countrySelector.className = 'default-content-wrapper';
  countrySelector.appendChild(label);
  countrySelector.appendChild(select);
  return countrySelector;
}

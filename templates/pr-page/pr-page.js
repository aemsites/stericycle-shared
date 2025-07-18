import { getMetadata } from '../../scripts/aem.js';
import { setJsonLd } from '../../scripts/scripts.js';

function getAboutBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    if (pathParts.length > 2 && pathParts[2] === 'about') {
      urlObj.pathname = `/${pathParts[1]}/about`;
    } else if (pathParts.length > 1 && pathParts[1] === 'about') {
      urlObj.pathname = '/about';
    } else {
      throw new Error('URL does not match expected pattern');
    }
    return urlObj.toString();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid URL:', error);
    return null;
  }
}

async function addBreadcrumbJsonLd(
  prBreadcrumb,
  prBreadcrumbUrl,
  titleBreadcrumb,
  titleBreadcrumbUrl,
) {
  setJsonLd({
    itemListElement: [
      {
        position: 1,
        item: {
          name: prBreadcrumb,
          '@id': prBreadcrumbUrl,
        },
        '@type': 'ListItem',
      },
      {
        position: 2,
        item: {
          name: titleBreadcrumb,
          '@id': titleBreadcrumbUrl,
        },
        '@type': 'ListItem',
      },
    ],
    '@type': 'BreadcrumbList',
    '@context': 'https://schema.org/',
  }, 'pr-breadcrumb');
}

function decorate(main) {
  const prBreadcrumb = getMetadata('pr-breadcrumb') || 'About Us';
  const { title } = document;
  const leftColumn = document.createElement('div');
  leftColumn.classList.add('main-content');//main-content
  const rightColumn = document.createElement('div');
  rightColumn.classList.add('related-content');
  // Create related content wrapper
  const rcWrapper = document.createElement('div');
  rcWrapper.classList.add('related-content-wrapper');

  const rcHeader = document.createElement('h4');
  rcHeader.classList.add('related-content-header');
  rcWrapper.append(rcHeader);
  const mainSection = main.querySelector('div.section');
  const defaultContent = main.querySelector('div.section > div.default-content-wrapper');
  leftColumn.append(...defaultContent.childNodes);
  rightColumn.append(rcWrapper);
  defaultContent.prepend(rightColumn);
  defaultContent.prepend(leftColumn);

  // Create title breadcrumb
  const titleBreadcrumb = document.createElement('span');
  titleBreadcrumb.classList.add('title-breadcrumb');
  titleBreadcrumb.textContent = title;

  // Create pr breadcrumb with a link
  const prBreadcrumbElement = document.createElement('p');
  prBreadcrumbElement.classList.add('pr-breadcrumb');
  // Get the pr base URL
  const prBaseUrl = getAboutBaseUrl(window.location.href);
  const prLinkElement = document.createElement('a');
  prLinkElement.textContent = prBreadcrumb;
  prLinkElement.href = prBaseUrl;
  prLinkElement.setAttribute('aria-label', prBreadcrumb);
  prBreadcrumbElement.append(prLinkElement, titleBreadcrumb);

  // Create a wrapper div for breadcrumbs
  const breadcrumbWrapper = document.createElement('div');
  breadcrumbWrapper.classList.add('breadcrumb-wrapper');
  breadcrumbWrapper.append(prBreadcrumbElement);
  // add the breadcrumbWrapper to the start of the leftColumn
  mainSection.prepend(breadcrumbWrapper);

  addBreadcrumbJsonLd(prBreadcrumb, prBaseUrl, title, window.location.href);
}

export default decorate;

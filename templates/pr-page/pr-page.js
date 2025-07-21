import { getMetadata } from '../../scripts/aem.js';
import { setJsonLd } from '../../scripts/scripts.js';

function getLocaleUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    return `/${pathParts[1]}`;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Invalid URL:', error);
    return null;
  }
}

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

function getPressReleasesBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    if (pathParts.length > 3 && pathParts[3] === 'press-releases') {
      urlObj.pathname = `/${pathParts[1]}/press-releases`;
    } else if (pathParts.length > 1 && pathParts[1] === 'press-releases') {
      urlObj.pathname = '/press-releases';
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
  localeBreadcrumb,
  localeBreadcrumbUrl,
  aboutUsBreadcrumb,
  aboutUsBreadcrumbUrl,
  prBreadcrumb,
  prBreadcrumbUrl,
  titleBreadcrumb,
  titleBreadcrumbUrl
) {
  setJsonLd(
    {
      itemListElement: [
        {
          position: 1,
          item: {
            name: localeBreadcrumb,
            '@id': localeBreadcrumbUrl,
          },
          '@type': 'ListItem',
        },
        {
          position: 2,
          item: {
            name: aboutUsBreadcrumb,
            '@id': aboutUsBreadcrumbUrl,
          },
          '@type': 'ListItem',
        },
        {
          position: 3,
          item: {
            name: prBreadcrumb,
            '@id': prBreadcrumbUrl,
          },
          '@type': 'ListItem',
        },
        {
          position: 4,
          item: {
            name: titleBreadcrumb,
            '@id': titleBreadcrumbUrl,
          },
          '@type': 'ListItem',
        },
      ],
      '@type': 'BreadcrumbList',
      '@context': 'https://schema.org/',
    },
    'pr-breadcrumb'
  );
}

function decorate(main) {
  const prBreadcrumb =
    getMetadata('pr-breadcrumb') ||
    'Paper Shredding & Document Destruction Services Near You';
  const aboutUsBreadcrumb = getMetadata('aboutUs-breadcrumb') || 'About Us';
  const prPressBreadcrumb = getMetadata('pr-press-breadcrumb') || 'Press Room';
  const { title } = document;
  const leftColumn = document.createElement('div');
  leftColumn.classList.add('main-content'); //main-content
  const rightColumn = document.createElement('div');
  rightColumn.classList.add('related-content');
  // Create related content wrapper
  const rcWrapper = document.createElement('div');
  rcWrapper.classList.add('related-content-wrapper');

  const rcHeader = document.createElement('h4');
  rcHeader.classList.add('related-content-header');
  rcWrapper.append(rcHeader);
  const mainSection = main.querySelector('div.section');
  const defaultContent = main.querySelector(
    'div.section > div.default-content-wrapper'
  );
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
  const prBaseUrl = getLocaleUrl(window.location.href);
  const prLinkElement = document.createElement('a');
  prLinkElement.textContent = prBreadcrumb;
  prLinkElement.href = prBaseUrl;
  prLinkElement.setAttribute('aria-label', prBreadcrumb);
  prBreadcrumbElement.append(prLinkElement, titleBreadcrumb);
  // Get about us pr base URL
  const prAboutBaseUrl = getAboutBaseUrl(window.location.href);
  const prAboutLinkElement = document.createElement('a');
  prAboutLinkElement.textContent = aboutUsBreadcrumb;
  prAboutLinkElement.href = prAboutBaseUrl;
  prAboutLinkElement.setAttribute('aria-label', aboutUsBreadcrumb);
  prBreadcrumbElement.append(prAboutLinkElement, titleBreadcrumb);
  // Get the press releases base URL
  const prPressUrl = getPressReleasesBaseUrl(window.location.href);
  const prPressLinkElement = document.createElement('a');
  prPressLinkElement.textContent = prPressBreadcrumb;
  prPressLinkElement.href = prPressUrl;
  prPressLinkElement.setAttribute('aria-label', prBreadcrumb);
  prBreadcrumbElement.append(prPressLinkElement, titleBreadcrumb);

  // Create a wrapper div for breadcrumbs
  const breadcrumbWrapper = document.createElement('div');
  breadcrumbWrapper.classList.add('breadcrumb-wrapper');
  breadcrumbWrapper.append(prBreadcrumbElement);
  // add the breadcrumbWrapper to the start of the leftColumn
  mainSection.prepend(breadcrumbWrapper);

  addBreadcrumbJsonLd(
    localeBreadcrumb,
    localeBreadcrumbUrl,
    aboutUsBreadcrumb,
    aboutUsBreadcrumbUrl,
    prBreadcrumb,
    prBreadcrumbUrl,
    title,
    window.location.href
  );
}

export default decorate;

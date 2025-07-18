import { getMetadata } from '../../scripts/aem.js';
import { setJsonLd } from '../../scripts/scripts.js';

function getBlogBaseUrl(url) {
  console.log('url', url);
  try {
    const urlObj = new URL(url);
    console.log('urlObj', urlObj);
    const pathParts = urlObj.pathname.split('/');

    if (pathParts.length > 2 && pathParts[2] === 'blog') {
      urlObj.pathname = `/${pathParts[1]}/blog`;
    } else if (pathParts.length > 1 && pathParts[1] === 'blog') {
      urlObj.pathname = '/blog';
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
  blogBreadcrumb,
  blogBreadcrumbUrl,
  titleBreadcrumb,
  titleBreadcrumbUrl,
) {
  setJsonLd({
    itemListElement: [
      {
        position: 1,
        item: {
          name: blogBreadcrumb,
          '@id': blogBreadcrumbUrl,
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
  }, 'blog-breadcrumb');
}

function decorate(main) {
  const blogBreadcrumb = getMetadata('blog-breadcrumb') || 'Blog';
  const { title } = document;
  const leftColumn = document.createElement('div');
  leftColumn.classList.add('blog-content');
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

  // Create blog breadcrumb with a link
  const blogBreadcrumbElement = document.createElement('p');
  blogBreadcrumbElement.classList.add('blog-breadcrumb');
  // Get the blog base URL
  const blogBaseUrl = getBlogBaseUrl(window.location.href);
  const blogLinkElement = document.createElement('a');
  blogLinkElement.textContent = blogBreadcrumb;
  blogLinkElement.href = blogBaseUrl;
  blogLinkElement.setAttribute('aria-label', blogBreadcrumb);
  blogBreadcrumbElement.append(blogLinkElement, titleBreadcrumb);

  // Create a wrapper div for breadcrumbs
  const breadcrumbWrapper = document.createElement('div');
  breadcrumbWrapper.classList.add('breadcrumb-wrapper');
  breadcrumbWrapper.append(blogBreadcrumbElement);
  // add the breadcrumbWrapper to the start of the leftColumn
  mainSection.prepend(breadcrumbWrapper);

  addBreadcrumbJsonLd(blogBreadcrumb, blogBaseUrl, title, window.location.href);
}

export default decorate;

/**
 * Function to build the breadcrumb element.
 * @returns {HTMLElement} - The breadcrumb element.
 */

// eslint-disable-next-line import/prefer-default-export
export function buildBreadcrumb(url) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter((segment) => segment);
  const languageSegment = pathSegments[0]?.match(/^[a-z]{2}-[a-z]{2}$/) ? pathSegments[0] : '';
  const homeHref = languageSegment ? `/${languageSegment}` : '/';
  const homeIcon = `<a href="${homeHref}"><span class="icon icon-home-white"><img data-icon-name="home-white" src="/icons/home-white.svg" alt="" loading="lazy"></span></a>`;
  const breadcrumbLabels = pathSegments.filter((segment) => segment !== languageSegment)
    .map((segment) => segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()));
  const breadcrumb = [homeIcon];
  let currentPath = languageSegment ? `/${languageSegment}` : '';

  breadcrumbLabels.forEach((label, index) => {
    currentPath += `/${pathSegments[index + (languageSegment ? 1 : 0)]}`;
    if (index === breadcrumbLabels.length - 1) {
      breadcrumb.push(label); // Last segment without URL
    } else {
      breadcrumb.push(`<a href="${currentPath}">${label}</a>`);
    }
  });

  if (breadcrumbLabels.length === 0) {
    breadcrumb.push('Home');
  }

  const separator = ' <img class="icon icon-chevron-right-white" src="/icons/chevron-right-white.svg" alt=">" loading="lazy"> ';
  return breadcrumb.join(separator);
}

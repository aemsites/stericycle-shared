import { decorateIcon } from '../../scripts/aem.js';

// eslint-disable-next-line import/prefer-default-export
export const applyCardLinkStyles = () => {
  requestAnimationFrame(() => {
    document.querySelectorAll('.card-section p').forEach((p) => {
      if (!p.classList.contains('button-container')) {
        const link = p.querySelector('a');
        const span = p.querySelector('span');

        // Validate whether the element is a link or inline text
        const hasOnlyLink = link && p.childNodes.length === 1;
        if (hasOnlyLink) {
          if (!p.classList.contains('button-container')) {
            p.classList.add('button-container');
          }

          if (!link.classList.contains('button')) {
            link.classList.add('button');
          }

          if (link.closest('strong')) {
            link.classList.add('primary');
          } else if (link.closest('em')) {
            link.classList.add('secondary');
          }

          if (span && span.classList.contains('icon') && p.classList.contains('button-container')) {
            decorateIcon(span);
          }
        }
      }
    });
  });
};

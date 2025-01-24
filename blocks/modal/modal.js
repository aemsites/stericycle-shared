import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';
import { sendDigitalDataEvent } from '../../scripts/martech.js';
import { getFormName, getTriggerTypeForAnalytics } from '../form/utils.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

export async function createModal(contentNodes, config) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener('click', () => dialog.close('default'));
  dialog.prepend(closeButton);

  const block = buildBlock('modal', '');
  document.querySelector('main').append(block);
  decorateBlock(block);
  await loadBlock(block);

  // close on click outside the dialog
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
    document.dispatchEvent(new CustomEvent('modal-closed', { bubbles: true, detail: config }));
    sendDigitalDataEvent({
      event: 'modalClosed',
      modalName: getFormName(dialog.querySelector('form')),
      triggerType: getTriggerTypeForAnalytics(config?.type),
    });
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
      document.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
      dialog.querySelector('form')?.focus();
      sendDigitalDataEvent({
        event: 'modalDisplayed',
        modalName: getFormName(dialog.querySelector('form')),
        triggerType: getTriggerTypeForAnalytics(config?.type),
      });
    },
  };
}

function addLinkToImage(imageSection) {
  const link = imageSection.getAttribute('data-link');
  const defaultContentWrapper = imageSection.querySelector('.default-content-wrapper');
  if (defaultContentWrapper) {
    const anchor = document.createElement('a');
    anchor.href = link;
    anchor.append(...defaultContentWrapper.childNodes);
    defaultContentWrapper.appendChild(anchor);
  }
}

export async function openModal(fragmentUrl, config) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;
  const fragment = await loadFragment(path);
  const imageContent = fragment.querySelector('.section.image');
  if (imageContent) {
    addLinkToImage(imageContent);
  }
  const { showModal } = await createModal(fragment.childNodes, config);
  showModal();
}

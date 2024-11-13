import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';
import { getSubmitBaseUrl } from '../form/constant.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

let stopTrigger = false;
let timer;
let scrollHandler;

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
  closeButton.addEventListener('click', () => dialog.close());
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

  dialog.addEventListener('close', () => {
    if (config) {
      sessionStorage.setItem(config?.path, true); // prevent closed model from triggering again in same session
    }
    stopTrigger = false;
    document.body.classList.remove('modal-open');
    block.remove();
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
      const event = new CustomEvent('modal-opened', { bubbles: true });
      block.dispatchEvent(event);
    },
  };
}

export async function openModal(fragmentUrl, config) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { block, showModal } = await createModal(fragment.childNodes, config);
  block.addEventListener('modal-opened', () => {
    stopTrigger = true; // stop triggering when modal is open
    if (scrollHandler) {
      document.removeEventListener('scroll', scrollHandler);
    }
  });
  showModal();
}

function isFormSubmitted() {
  return sessionStorage.getItem('formSubmitted');
}

function triggerHandler(config) {
  const { path, value } = config;
  if (!isFormSubmitted()) {
    if (!sessionStorage.getItem(path)) { // prevent trigger modal from opening if already closed
      timer = setTimeout(() => {
        if (!stopTrigger) openModal(path, config); // stop trigger modal from opening if another modal is open
      }, parseInt(value, 10) * 1000);
    }
  }
}

/**
 * This method triggers the modal after config[value] seconds has elapsed
 * If a non trigger modal is already open, it will not trigger another modal.
 * @param {Object} config
 */
function openOnPageTime(config) {
  triggerHandler(config);
}

/** Limits the execution of the callbackFn function to once every limit milliseconds. */
function throttle(callbackFn, limit) {
  if (!stopTrigger) {
    let wait = false;
    return () => {
      if (!wait) {
        callbackFn();
        wait = true;

        setTimeout(() => {
          wait = false;
        }, limit);
      }
    };
  }
  return null;
}

/** This method triggers the modal if user scrolls to config[value] percentage of the page */
function scroll(config) {
  const value = parseInt(config.value, 10);
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = value <= 90 ? (winScroll / height) * 100 : (winScroll / height) * 100 + 10;

  if (scrolled >= value && !sessionStorage.getItem(config.path) && !stopTrigger) {
    stopTrigger = true;
    openModal(config.path, config);
  }
}

function openOnScroll(config) {
  scrollHandler = throttle(() => { scroll(config); }, 200);
  document.addEventListener('scroll', scrollHandler);
}

/**
 * This method triggers the modal if user tries to exit the page after config[value] seconds has elapsed
 * If a non trigger modal is already open, it will not trigger another modal.
 * @param {Object} config
 */
function openOnExitIntent(config) {
  document.addEventListener('mouseleave', () => {
    triggerHandler(config);
  });

  document.addEventListener('mouseenter', () => {
    if (timer) clearTimeout(timer);
  });
}

export async function openOnTrigger(config) {
  const { type } = config;
  switch (type.toLowerCase().trim()) {
    case 'time': openOnPageTime(config);
      break;
    case 'scroll': openOnScroll(config);
      break;
    case 'exit': openOnExitIntent(config);
      break;
    default: throw new Error('Invalid trigger type');
  }
}

import { openModal } from '../modal/modal.js';

let stopTrigger = false;
let timer;
let scrollHandler;

export function isFormSubmitted() {
  return sessionStorage.getItem('formSubmitted');
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

async function triggerHandler(config) {
  const { path, value } = config;
  if (!isFormSubmitted()) {
    if (!sessionStorage.getItem(path)) { // prevent trigger modal from opening if already closed
      timer = setTimeout(async () => {
        if (!stopTrigger) { // stop triggering when another modal is open
          openModal(config.path, config);
        }
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

function registerEventListeners() {
  document.addEventListener('modal-open', () => {
    stopTrigger = true;
    if (scrollHandler) {
      document.removeEventListener('scroll', scrollHandler);
    }
  });
  document.addEventListener('modal-closed', (e) => {
    stopTrigger = false;
    if (e?.detail) {
      sessionStorage.setItem(e.detail.path, true); // prevent closed model from triggering again in same session
    }
  });
}

export async function openOnTrigger(config) {
  const { type } = config;
  registerEventListeners();
  switch (type.toLowerCase().trim()) {
    case 'time': openOnPageTime(config);
      break;
    case 'scroll': openOnScroll(config);
      break;
    case 'exit': openOnExitIntent(config);
      break;
    default: throw new Error('Invalid trigger type specified for modal');
  }
}

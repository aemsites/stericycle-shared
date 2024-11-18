import { openModal } from '../modal/modal.js';

let stopTrigger = false;
let timer;

export function isFormSubmitted() {
  return sessionStorage.getItem('formSubmitted');
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
  });
  document.addEventListener('modal-closed', (e) => {
    stopTrigger = false;
    if (e?.detail) {
      sessionStorage.setItem(e.detail.path, true); // prevent closed model from triggering again in same session
    }
  });
}

/**
 * This function triggers a modal based on the specified configuration.
 * @param {Config} config - The configuration object for triggering the modal.
 */
export function openOnTrigger(config) {
  const { path, type, value } = config;
  if (path && type && value) {
    registerEventListeners();
    if (type.toLowerCase().trim() === 'time') {
      openOnPageTime(config);
    } else if (type.toLowerCase().trim() === 'exit') {
      openOnExitIntent(config);
    }
  }
}

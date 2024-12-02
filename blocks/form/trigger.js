import { sampleRUM } from '../../scripts/aem.js';

let stopTrigger = false;
let timer;

export function isFormSubmitted() {
  return sessionStorage.getItem('formSubmitted');
}

async function triggerHandler(config, trigger) {
  const { path, value } = config;
  if (!isFormSubmitted()) {
    if (!sessionStorage.getItem(path) && trigger) { // prevent trigger modal from opening if already closed
      timer = setTimeout(async () => {
        if (!stopTrigger) { // stop triggering when another modal is open
          trigger(config.path, config);
          sampleRUM('modal-triggered', { source: config?.type });
        }
      }, parseInt(value, 10) * 1000);
    }
  }
}
/**
 * This method triggers the modal if user scrolls to config[value]  percentage of the visible page
 * @param {Object} config
 * @param trigger - The callback to be invoked when user action is triggered.
 */
function openOnScroll(config, trigger) {
  const value = parseInt(config.value, 10);
  const target = document.createElement('div');
  const documentHeight = document.documentElement.scrollHeight;
  const triggerPosition = (value / 100) * documentHeight;
  target.style.position = 'absolute';
  target.style.top = `${triggerPosition}px`;
  document.body.appendChild(target);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !sessionStorage.getItem(config.path)) {
        trigger(config.path, config);
        sampleRUM('modal-triggered', { source: config?.type });
        observer.disconnect();
      }
    });
  }, {
    root: null, // Observe relative to the viewport
    threshold: 0, // Trigger when any part of the element is visible
  });
  observer.observe(target);
}

/**
 * This method triggers the modal after config[value] seconds has elapsed
 * If a non trigger modal is already open, it will not trigger another modal.
 * @param {Object} config
 * @param trigger - The callback to be invoked when user action is triggered.
 */
function openOnPageTime(config, trigger) {
  triggerHandler(config, trigger);
}

/**
 * This method triggers the modal if user tries to exit the page after config[value] seconds has elapsed
 * If a non trigger modal is already open, it will not trigger another modal.
 * @param {Object} config
 * @param trigger - The callback to be invoked when user action is triggered.
 */
function openOnExitIntent(config, trigger) {
  document.addEventListener('mouseleave', () => {
    triggerHandler(config, trigger);
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
 * @param trigger - The callback to be invoked when user action is triggered.
 */
export function openOnTrigger(config, trigger) {
  const { path, type, value } = config;
  if (path && type && value) {
    registerEventListeners();
    switch (type.toLowerCase().trim()) {
      case 'time':
        openOnPageTime(config, trigger);
        break;
      case 'exit':
        openOnExitIntent(config, trigger);
        break;
      case 'scroll':
        setTimeout(() => {
          openOnScroll(config, trigger);
        }, 3000);
        break;
      default: throw new Error('Invalid trigger type specified for modal');
    }
  }
}

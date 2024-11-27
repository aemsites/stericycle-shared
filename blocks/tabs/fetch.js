import { loadFragment } from '../fragment/fragment.js';
import { toClassName } from '../../scripts/aem.js';
import { button, div, h3, li, ol, span } from '../../scripts/dom-helpers.js';
import { BREAKPOINTS } from '../../scripts/scripts.js';

// Transition derived from https://css-tricks.com/using-css-transitions-auto-dimensions/
function expandPanel(panel) {
  const height = panel.scrollHeight;
  const transition = () => {
    panel.style.height = null;
    panel.removeEventListener('transitionend', transition);
  };
  panel.addEventListener('transitionend', transition);
  requestAnimationFrame(() => {
    panel.setAttribute('aria-hidden', false);
    panel.style.height = `${height}px`;
  });
}

function collapsePanel(panel) {
  const height = panel.scrollHeight;
  panel.style.height = `${height}px`;
  requestAnimationFrame(() => {
    panel.setAttribute('aria-hidden', true);
    panel.style.height = null;
  });
}

// Mobile view swap
function toggleTab(btn) {
  const block = btn.closest('.block.tabs');
  const open = btn.getAttribute('aria-expanded') === 'true';
  block.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', false);
  });
  block.querySelectorAll('[aria-hidden="false"]').forEach((el) => {
    collapsePanel(el);
  });
  btn.setAttribute('aria-expanded', !open);
  const target = btn.getAttribute('aria-controls');
  const panel = document.getElementById(target);
  if (open) {
    collapsePanel(panel);
    window.history.pushState(null, null, window.location.pathname);
  } else {
    expandPanel(panel);
    window.history.pushState(null, null, `#${target}`);
  }
}

// Desktop view swap
function swapTab(listItem) {
  const block = listItem.closest('.block.tabs');
  if (block.querySelector('li[aria-expanded="true"]') === listItem) return;
  const target = listItem.getAttribute('aria-controls');
  const panel = document.getElementById(target);
  block.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', false);
  });
  block.querySelectorAll('[aria-hidden="false"]').forEach((el) => {
    el.setAttribute(['aria-hidden'], true);
  });
  listItem.setAttribute('aria-expanded', true);
  panel.setAttribute('aria-hidden', false);
  window.history.pushState(null, null, `#${target}`);
}

export default async function decorate(block) {
  let target = block.children[0].querySelector('a')?.getAttribute('href');
  if (!target) {
    target = block.children[0].textContent;
  }

  // Make sure the target is a valid URL
  try {
    const base = window.location.ancestorOrigins?.length > 0 ? window.location.ancestorOrigins[0] : window.location.origin;
    // eslint-disable-next-line no-new
    new URL(target, base);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('Invalid block configuration. Expected a URL or a link.');
    block.remove();
  }

  block.replaceChildren();

  const content = await loadFragment(target);
  if (content) {
    const list = ol({ class: 'tab-list' });
    const tabs = div({ class: 'tab-control' }, list);
    content.querySelectorAll('.section').forEach((section, idx) => {
      const hidden = !BREAKPOINTS.tablet.matches || idx !== 0;
      const title = section.getAttribute('data-title') || `Tab ${idx + 1}`;
      let id = toClassName(title);
      while (document.querySelector(`#tab-${id}`)) {
        id += '-1';
      }
      const btn = button(
        { 'aria-expanded': false, 'aria-controls': `tab-${id}-content` },
        span(title),
        span({ class: 'icon' }),
      );
      const tabpanel = div(
        { class: 'tab-panel' },
        h3({ class: 'tab-title' }, btn),
        div({ id: `tab-${id}-content`, class: 'tab-content', 'aria-hidden': hidden }, section),
      );
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleTab(e.currentTarget);
      });

      const listItem = li({
        class: 'tab-item',
        'aria-controls': `tab-${id}-content`,
        'aria-expanded': (idx === 0),
      }, title);
      listItem.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        swapTab(e.currentTarget);
      });
      list.append(listItem);

      block.append(tabpanel);
    });
    block.prepend(tabs);

    BREAKPOINTS.tablet.addEventListener('change', () => {
      if (BREAKPOINTS.tablet.matches) {
        const active = block.querySelector('button[aria-expanded="true"]');
        const selector = active ? `li[aria-controls="${active.getAttribute('aria-controls')}"]` : 'li[aria-controls]';
        const listItem = block.querySelector(selector);
        swapTab(listItem);
      } else {
        const active = block.querySelector('li[aria-expanded="true"]');
        const btn = block.querySelector(`button[aria-controls="${active.getAttribute('aria-controls')}"]`);
        if (btn) toggleTab(btn);
      }
    });

    // Can't do expand/collapse on mobile, so we don't do that here.
    if (window.location.hash !== '#') {
      const hash = window.location.hash.substring(1);
      if (BREAKPOINTS.tablet.matches) {
        const listItem = block.querySelector(`li[aria-controls="${hash}"]`);
        if (listItem) swapTab(listItem);
      }
    }
  }
}

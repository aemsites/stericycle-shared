// eslint-disable-next-line import/no-unresolved
import { toClassName } from '../../scripts/aem.js';

function hasWrapper(el) {
  return !!el.firstElementChild && window.getComputedStyle(el.firstElementChild).display === 'block';
}

function addAccordionAnimation(details) {
  const summary = details.querySelector('summary');

  summary.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default behavior of summary
    if (details.hasAttribute('open')) {
      details.classList.add('close');
      details.classList.remove('open');
      setTimeout(() => {
        details.removeAttribute('open');
        details.classList.remove('close');
      }, 300); // Match this duration with the CSS animation duration
    } else {
      details.classList.add('open');
      details.setAttribute('open', '');
    }
  });
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);
    // decorate tabpanel
    const tabpanel = block.children[i];
    const tabpanelCopy = tabpanel.cloneNode(true);
    tabpanel.className = 'tabs-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');
    if (!hasWrapper(tabpanel.lastElementChild)) {
      tabpanel.lastElementChild.innerHTML = `<p>${tabpanel.lastElementChild.innerHTML}</p>`;
    }

    // decorate faq item label
    if (tabpanelCopy.children.length >= 3) {
      const label = tabpanelCopy.children[1].querySelector('h3');
      const summary = document.createElement('summary');
      summary.className = 'tab-item-label';
      summary.append(...label.childNodes);
      if (!hasWrapper(summary)) {
        summary.innerHTML = `${summary.innerHTML}`;
        summary.innerHTML += '<span></span>';
      }
      // decorate faq item body
      const body = tabpanelCopy;
      body.className = 'tab-item-body';
      if (!hasWrapper(body)) {
        const bodyText = body.children[1].querySelector('p');
        body.innerHTML = `<p>${bodyText ? bodyText.innerText : ''}</p>`;
      }
      // decorate faq item
      const details = document.createElement('details');
      details.className = 'tab-item';
      details.append(summary, body);
      tabpanel.append(details);

      addAccordionAnimation(details);
    }

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);
}

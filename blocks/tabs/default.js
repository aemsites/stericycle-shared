// eslint-disable-next-line import/no-unresolved
import { decorateIcons, toClassName } from '../../scripts/aem.js';
import { embedWistia } from '../../scripts/scripts.js';

function hasWrapper(el) {
  return !!el.firstElementChild && window.getComputedStyle(el.firstElementChild).display === 'block';
}

function modifyIcon(icon) {
  if (icon && !icon.classList.contains('custom-icon')) {
    icon.classList.add('custom-icon');
    icon.querySelector('span').innerHTML = '';
    decorateIcons(icon);
  }
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
  let wistiaEmbed;

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
    if (block.classList.contains('vertical') && block.classList.contains('video')) {
      const wistiaLink = tabpanel.querySelector('a');
      wistiaEmbed = embedWistia(wistiaLink, false, false, 'contain', 'true');
      tabpanel.replaceChildren(wistiaEmbed);
    }
    if (!hasWrapper(tabpanel.lastElementChild)) {
      tabpanel.lastElementChild.innerHTML = `<p>${tabpanel.lastElementChild.innerHTML}</p>`;
    }

    // decorate faq item label
    if (block.classList.contains('vertical') && tabpanelCopy.children.length >= 3) {
      const label = tabpanelCopy.children[1].querySelector('h3');
      const summary = document.createElement('summary');
      summary.className = 'tab-item-label';
      summary.append(...label.childNodes);
      if (!hasWrapper(summary)) {
        summary.innerHTML = `${summary.innerHTML}`;
        summary.innerHTML += '<span></span>';
      }
      // decorate faq item body`
      const body = tabpanelCopy;
      body.className = 'tab-item-body';
      if (!hasWrapper(body)) {
        const bodyText = body.children[1].querySelector('p');
        const bodyList = body.children[1].querySelector('ul');
        if (bodyText) {
          body.innerHTML = `<p>${bodyText ? bodyText.innerText : ''}</p>`;
        }
        if (bodyList) {
          body.innerHTML = `${bodyList ? bodyList.outerHTML : ''}`;
        }
      }
      // decorate faq item
      const details = document.createElement('details');
      details.className = 'tab-item';
      details.append(summary, body);
      tabpanel.append(details);

      addAccordionAnimation(details);
    }
    if (block.classList.contains('video')) {
      const summary = document.createElement('summary');
      summary.className = 'tab-item-label';
      const label = document.createElement('h3');
      label.textContent = tabpanelCopy.children[0].textContent.replaceAll('\n', '').replaceAll('  ', '');
      summary.append(label);
      if (!hasWrapper(summary)) {
        summary.innerHTML = `${summary.innerHTML}`;
        summary.innerHTML += '<span></span>';
      }
      const body = tabpanel.cloneNode(true);
      body.className = 'tab-item-body';

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
    const pElement = button.querySelector('p');

    if (pElement) {
      modifyIcon(pElement);
    }

    button.addEventListener('click', () => {
      window.history.pushState(null, null, `#${button.id}`);
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

  if (window.location.hash) {
    const tab = tablist.querySelector(window.location.hash);
    if (tab) {
      tab.click();
    }
  }

  if (block.classList.contains('cta-list')) {
    const tabpanelSelected = document.querySelectorAll('.tabs-panel');
    tabpanelSelected.forEach((panel) => {
      const contentWrappers = panel && panel.querySelectorAll('div');
      if (contentWrappers) {
        contentWrappers.forEach((element) => {
          const childElements = Array.from(element.children);
          const linkElement = childElements.find((el) => el.tagName === 'P' && el.classList.contains('button-container') && el.querySelector('a[href]'));
          if (linkElement) {
            const href = linkElement.querySelector('a').getAttribute('href');
            const wrapper = document.createElement('a');
            wrapper.setAttribute('href', href);
            wrapper.className = 'wrapped-content';

            const firstIconParagraph = childElements.find((el) => el.tagName === 'P' && el.querySelector('span.icon'));
            const lastIconParagraph = [...childElements].reverse().find((el) => el.tagName === 'P' && el.querySelector('span.icon'));
            const remainingContent = childElements.filter((el) => el !== firstIconParagraph && el !== lastIconParagraph && el !== linkElement);

            if (remainingContent.length > 0) {
              const wrapperContent = document.createElement('div');
              wrapperContent.className = 'tab-item-body';
              wrapperContent.append(...remainingContent);

              if (firstIconParagraph) {
                firstIconParagraph.classList.add('first-icon-paragraph');
                modifyIcon(firstIconParagraph);
                wrapper.append(firstIconParagraph);
              }

              wrapper.append(wrapperContent);

              if (lastIconParagraph && lastIconParagraph !== firstIconParagraph) {
                lastIconParagraph.classList.add('last-icon-paragraph');
                modifyIcon(lastIconParagraph);
                wrapper.append(lastIconParagraph);
              }

              element.innerHTML = '';
              element.append(wrapper);
            }
          }
        });
      }
    });
  }

  block.prepend(tablist);
}

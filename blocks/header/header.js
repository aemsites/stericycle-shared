import { decorateButtons, getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('role', 'button');
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('role');
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }
  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const locale = window.location.pathname.split('/')[1] || 'en-us'; // default to us-en if no locale in path
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : `/${locale}/nav`;
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSections.querySelector('span.icon-search')) {
        navSections.addEventListener('click', () => {
          // eslint-disable-next-line
          console.log('search'); // put the search box stuff here
        });
      }

      if (navSections.querySelector('li > strong')) {
        const paragraph = document.createElement('p');
        const btn = navSections.querySelector('li > strong').cloneNode(true);
        paragraph.append(btn);
        decorateButtons(paragraph);
        navSections.querySelector('li > strong').replaceWith(paragraph);
      }
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const navTools = nav.querySelector('.nav-tools');
  if (navTools) {
    navTools.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navTool) => {
      if (navTool.querySelector('a')) {
        if (navTool.querySelector('a').getAttribute('title').startsWith('Customer Service')
            || navTool.querySelector('a').getAttribute('title').startsWith('Sales')) {
          navTool.querySelector('a').classList.add('tel');
        }
        if (navTool.querySelector('a').getAttribute('title').startsWith('Find Your')) {
          navTool.querySelector('a').classList.add('loc');
        }
      }

      if (navTool.querySelector('ul')) navTool.classList.add('nav-drop');
      navTool.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navTool.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navTools);
          navTool.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const overlay = document.createElement('div');
  overlay.className = 'overlay';

  const closeButton = document.createElement('button');
  closeButton.className = 'close-btn';
  closeButton.innerHTML = 'X';
  overlay.appendChild(closeButton);

  const menuDiv = document.createElement('div');
  menuDiv.className = 'menu-items';
  navSections.querySelectorAll('.default-content-wrapper > ul > li').forEach((navSection) => {
    const clonedNavSection = navSection.cloneNode(true);
    if(clonedNavSection.classList.contains('nav-drop')) {
      const nestedUl = clonedNavSection.querySelector('ul');
      if(nestedUl) {
        nestedUl.style.display = 'none';
      };
    }

    const aElement = clonedNavSection.querySelector('a');
    const iconSpan = clonedNavSection.querySelector('span img');
    let className;

    if (aElement) {
      className = aElement.textContent.trim().toLowerCase().replace(/ /g, '-');
    } else {
      const textNode = Array.from(clonedNavSection.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        className = textNode.nodeValue.trim().toLowerCase().replace(/ /g, '-');
      }
    }

    if (iconSpan) {
      clonedNavSection.style.display = 'none';
      clonedNavSection.classList.add('.search-icon');
    }

    clonedNavSection.classList.add(className);
    menuDiv.appendChild(clonedNavSection);
  });

  navTools.querySelectorAll('.default-content-wrapper > ul > li').forEach((navTool) => { 
    const clonedNavTool = navTool.cloneNode(true);
    console.log('clonedNavTool', clonedNavTool);
    const lastFourLiElements = Array.from(clonedNavTool).slice(-4);
    console.log('lastFourLiElements', lastFourLiElements);

    lastFourLiElements.forEach(liElement => {
      const clonedLi = liElement.cloneNode(true);
      console.log('clonedLi', clonedLi);
      menuDiv.appendChild(clonedLi);
    });
  });
  overlay.appendChild(menuDiv);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => {
      document.body.append(overlay);
      toggleMenu(nav, navSections);
      if (overlay) {
        if (nav.getAttribute('aria-expanded') === 'true') {
          setTimeout(() => {
            overlay.classList.add('menu-open');
          }, 0);
          closeButton.addEventListener('click', () => {
            const overlay = document.querySelector('.overlay');
            overlay.classList.remove('menu-open');

            // Find the nav element and set 'aria-expanded' to 'false'
            const nav = document.querySelector('header nav');
            nav.setAttribute('aria-expanded', 'false');

            // Remove 'overflow-y: hidden' from the body tag
            document.body.style.overflowY = '';
          });
        } else {
          overlay.classList.remove('menu-open');
        }
      }
  });
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}

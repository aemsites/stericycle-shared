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

function toggleSearchBarVisibility() {
  // Toggle visibility and aria-expanded attribute
  const searchBoxContainer = document.querySelector('.search-box-container');
  if (searchBoxContainer.style.display === 'none') {
    searchBoxContainer.style.display = 'flex';
    const listItem = searchBoxContainer.closest('li');
    if (listItem) listItem.setAttribute('aria-expanded', 'true');
  } else {
    searchBoxContainer.addEventListener('click', (e) => {
      if (!e.target.classList.contains('close-button')) {
        e.stopPropagation(); // Stop event propagation if not clicking on close button
      }
    });
    searchBoxContainer.style.display = 'none';
    const listItem = searchBoxContainer.closest('li');
    if (listItem) listItem.setAttribute('aria-expanded', 'false');
  }
}

function createAndAppendSearchBox() {
  let searchBoxContainer = document.querySelector('.search-box-container');
  if (!searchBoxContainer) {
    const icon = document.querySelector('.icon-search');
    searchBoxContainer = document.createElement('div');
    searchBoxContainer.className = 'search-box-container';
    searchBoxContainer.style.display = 'none'; // Initially hidden

    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search';
    searchBox.className = 'search-box';
    searchBox.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop event propagation
    });

    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.className = 'close-button';

    searchBoxContainer.appendChild(searchBox);
    searchBoxContainer.appendChild(closeButton);
    icon.parentNode.insertBefore(searchBoxContainer, icon.nextSibling);
  }
  toggleSearchBarVisibility();
}

function hideAllSubNavs() {
  const mobileMenuItem = document.querySelectorAll('.mobile-menu-item-drop');
  const itemDropContent = document.querySelector('.item-drop-content');
  itemDropContent.classList.remove('active');
  mobileMenuItem.forEach((menuItem) => {
    menuItem.classList.remove('block');
    const aTag = menuItem.querySelector('.title > a'); // Select the a tag within newDiv
    if (aTag) {
      menuItem.removeChild(menuItem.querySelector('.title')); // Remove newDiv from item
      menuItem.prepend(aTag); // Add the a tag directly to item
    }
  });
  const menuItems = document.querySelectorAll('.mobile-menu-item');
  menuItems.forEach((menuItem) => {
    menuItem.classList.remove('remove');
  });
  const arrow = document.querySelectorAll('.arrow');
  arrow.forEach((a) => {
    a.classList.remove('remove');
  });
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
  if (navSections.querySelector('span.icon-search')) {
    const searchBox = document.querySelector('.search-box-container');
    navSections.addEventListener('click', () => {
      const icon = navSections.querySelector('span.icon-search');
      if (!icon) return;
      const listItem = icon.closest('li');
      if (!listItem) return;
      if (!searchBox) {
        createAndAppendSearchBox();
      } else {
        searchBox.style.display = 'none';
        listItem.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSections.querySelector('li > strong')) {
        const paragraph = document.createElement('p');
        const btn = navSections.querySelector('li > strong').cloneNode(true);
        paragraph.append(btn);
        decorateButtons(paragraph);
        navSections.querySelector('li > strong').replaceWith(paragraph);
      }
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        navSection.querySelector('ul').classList.add('nav-drop-content');
      }
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
    const navDrops = navSections.querySelector('.nav-drop ul');
    navDrops.classList.add('single-column');

    const checkNavSections = navSections.querySelector('ul');
    const checkNavSectionsLi = checkNavSections.querySelectorAll('li.nav-drop');
    if (checkNavSectionsLi.length > 0) {
      checkNavSectionsLi[checkNavSectionsLi.length - 1].classList.add('last');
    }
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

  const mobileMenu = nav.querySelector('nav .section:last-child');
  if (mobileMenu) {
    mobileMenu.classList.add('mobile-menu');
    mobileMenu.querySelector('ul').classList.add('mobile-menu-content');
  }
  const menuItems = nav.querySelectorAll('.mobile-menu-content > li');
  menuItems.forEach((item) => {
    item.classList.add('mobile-menu-item');
    if (item.querySelector('ul')) {
      const arrow = document.createElement('button');
      arrow.textContent = '>';
      arrow.classList.add('arrow');

      const backArrow = document.createElement('button');
      backArrow.textContent = '<';
      backArrow.classList.add('back-arrow');

      const ul = item.querySelector('ul');

      arrow.addEventListener('click', () => {
        ul.classList.toggle('active');
        item.prepend(backArrow);
        const newDiv = document.createElement('div');
        newDiv.className = 'title';
        newDiv.append(backArrow);
        newDiv.append(item.querySelector('a'));
        item.prepend(newDiv);
        mobileMenu.querySelectorAll('.mobile-menu-item').forEach((menuItem) => {
          if (!menuItem.contains(ul)) {
            menuItem.classList.add('remove');
            arrow.classList.add('remove');
          }
        });
        item.classList.add('block');
      });
      item.append(arrow);
      backArrow.addEventListener('click', () => {
        hideAllSubNavs();
      });
    }
    mobileMenu.querySelectorAll(':scope li').forEach((menuItem) => {
      if (menuItem.querySelector('ul')) {
        menuItem.classList.add('mobile-menu-item-drop');
        menuItem.querySelector('ul').classList.add('item-drop-content');
      }
    });

    const checkNavSections = navSections.querySelector('ul');
    const checkNavSectionsLi = checkNavSections.querySelectorAll('li.nav-drop');
    if (checkNavSectionsLi.length > 0) {
      checkNavSectionsLi[checkNavSectionsLi.length - 1].classList.add('last');
    }
    Array.from(item.childNodes).forEach((child) => {
      // Check if the child is a text node and not just whitespace
      if (child.nodeType === 3 && child.nodeValue.trim().length > 0) {
        const span = document.createElement('span');
        span.className = 'text';
        span.textContent = child.nodeValue.trim();
        item.replaceChild(span, child);
      }
    });
    if (item.querySelector('span.icon-us')) {
      const iconSpan = item.querySelector('span.icon-us');
      const textSpan = item.querySelector('span.text');
      if (iconSpan && textSpan) {
        const newDiv = document.createElement('div');
        newDiv.className = 'flag-icon';
        if (iconSpan) { newDiv.appendChild(iconSpan); }
        if (textSpan) { newDiv.appendChild(textSpan); }
        item.prepend(newDiv);
      }
    }
    if (item.querySelector('strong a')) {
      const paragraph = document.createElement('p');
      const btn = item.querySelector('strong').cloneNode(true);
      paragraph.append(btn);
      decorateButtons(paragraph);
      item.querySelector('strong').replaceWith(paragraph);
    }
  });
  const closeButton = document.createElement('button');
  closeButton.className = 'close-btn';
  closeButton.innerHTML = 'x';
  mobileMenu.appendChild(closeButton);

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
       <span class="nav-hamburger-icon"></span>
     </button>`;
  hamburger.addEventListener('click', () => {
    toggleMenu(nav, navSections);
    if (mobileMenu) {
      if (nav.getAttribute('aria-expanded') === 'true') {
        setTimeout(() => {
          mobileMenu.classList.add('mobile-menu-open');
        }, 0);
        closeButton.addEventListener('click', () => {
          nav.setAttribute('aria-expanded', 'false');
          document.body.style.overflowY = '';
          mobileMenu.classList.remove('mobile-menu-open');
        });
      } else {
        mobileMenu.classList.remove('mobile-menu-open');
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

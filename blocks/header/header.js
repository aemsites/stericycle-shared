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

// Create and append search box to the nav
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

function handleForwardArrowClick(e, item, ul, arrow, backArrow, innerBackArrow, mobileMenu) {
  const currentElementParent = (e.currentTarget).parentElement;
  if (e.currentTarget.classList.contains('inner-arrow')) {
    e.stopPropagation();

    const listItems = item.querySelectorAll('.list-items');
    listItems.forEach((listItem) => {
      listItem.classList.remove('expand');
    });
    currentElementParent.classList.add('active');
    e.currentTarget.classList.add('remove');
    const parentMenuItem = e.currentTarget.closest('.list');
    parentMenuItem.querySelectorAll('.list-items').forEach((list) => {
      if (list !== currentElementParent) {
        list.classList.add('remove');
      }
    });
    const existingTitle = item.querySelector('.title');
    if (existingTitle) {
      existingTitle.remove();
    }

    const title = item.querySelector('.list-items.active > strong');
    const titleContent = title.cloneNode(true);
    const newDiv = document.createElement('div');
    newDiv.className = 'title';
    newDiv.append(innerBackArrow);
    newDiv.append(titleContent);
    item.prepend(newDiv);
    title.classList.add('remove');
  }
  const listElement = currentElementParent.querySelector('.list');
  if (!listElement.classList.contains('active')) {
    listElement.classList.add('active');
  }

  let titleContent;
  const anchor = item.querySelector('li > a:first-of-type');

  if (anchor && anchor === item.firstChild) {
    titleContent = anchor.cloneNode(true);
    anchor.classList.add('remove');
  } else {
    const textElement = currentElementParent.querySelector('strong');
    titleContent = textElement ? textElement.cloneNode(true) : document.createTextNode('');
  }

  const existingTitle = item.querySelector('.title');
  if (existingTitle) {
    existingTitle.remove();
  }

  if (currentElementParent.querySelector('.flag-icon')) {
    const title = document.createElement('strong');
    const titleText = 'Country';
    title.textContent = titleText;

    const newDiv = document.createElement('div');
    newDiv.className = 'title';
    newDiv.append(backArrow);
    newDiv.append(title);
    item.prepend(newDiv);
    currentElementParent.querySelector('.flag-icon').classList.add('remove');
    Array.from(currentElementParent.querySelectorAll('.list .list-items')).forEach((it) => {
      const iconSpan = it.querySelector('span.icon');
      Array.from(it.childNodes).forEach((child) => {
        if (child.nodeType === 3 && child.nodeValue.trim().length > 0) {
          const span = document.createElement('span');
          span.className = 'text';
          span.textContent = child.nodeValue.trim();
          child.replaceWith(span);
        }
      });

      const textSpan = it.querySelector('span.text');
      if (iconSpan && textSpan) {
        const div = document.createElement('div');
        div.className = 'flag-icon';
        div.appendChild(iconSpan.cloneNode(true));
        div.appendChild(textSpan.cloneNode(true));
        it.innerHTML = '';
        it.appendChild(div);
      }
    });
  } else {
    // Create a new title div
    const newDiv = document.createElement('div');
    newDiv.className = 'title';
    newDiv.append(backArrow);
    newDiv.append(titleContent);
    item.prepend(newDiv);
  }

  // hide other menu items
  mobileMenu.querySelectorAll('.mobile-menu-item').forEach((menuItem) => {
    if (!menuItem.contains(ul)) {
      menuItem.classList.add('remove');
      arrow.classList.add('remove');
    }
  });
  item.classList.add('block');
}

function handleBackArrowClick(e, backArrow) {
  e.preventDefault();

  const parentMenuItem = e.target.closest('.mobile-menu-item-drop');
  const currentList = parentMenuItem.querySelector('.list.active');

  const titleDiv = parentMenuItem.querySelector('.title');
  if (titleDiv) {
    titleDiv.remove();
  }
  if (parentMenuItem.querySelector('.flag-icon')) {
    parentMenuItem.querySelector('.flag-icon').classList.remove('remove');
  }
  if (parentMenuItem.querySelector(':scope > a')) {
    parentMenuItem.querySelector(':scope > a').classList.remove('remove');
  }
  parentMenuItem.querySelector(':scope > .arrow').classList.remove('remove');
  if (currentList) {
    currentList.classList.remove('active');
    parentMenuItem.classList.remove('block');
  }

  // Show all menu items that were hidden
  document.querySelectorAll('.mobile-menu-item.remove').forEach((menuItem) => {
    menuItem.classList.remove('remove');
  });
  backArrow.classList.remove('active');
}

function handleInnerBackArrowClick(e, backArrow) {
  e.preventDefault();
  const parentMenuItem = e.target.closest('.mobile-menu-item-drop');

  let titleContent;
  const anchor = parentMenuItem.querySelector('li > a:first-of-type');
  if (anchor) {
    titleContent = anchor.cloneNode(true);
    anchor.classList.add('remove');
  }

  const existingTitle = parentMenuItem.querySelector('.title');
  if (existingTitle) {
    existingTitle.remove();
  }

  // Create a new title div
  const newDiv = document.createElement('div');
  newDiv.className = 'title';
  newDiv.append(backArrow);
  newDiv.append(titleContent);
  parentMenuItem.prepend(newDiv);

  const currentList = parentMenuItem.querySelector('a');
  if (currentList) {
    currentList.classList.remove('remove');
  }
  parentMenuItem.querySelectorAll('.list-items').forEach((lit) => {
    lit.classList.add('expand');
    if (lit.classList.contains('remove')) {
      lit.classList.remove('remove');
    } else if (lit.classList.contains('active')) {
      lit.querySelector('strong').classList.remove('remove');
      lit.querySelector('.inner-arrow').classList.remove('remove');
      if (lit.querySelector('.sublist')) {
        lit.querySelector('.sublist').classList.remove('active');
        lit.querySelector('.sublist').classList.add('remove');
      }
      lit.classList.remove('active');
    }
  });
}

// function to reset the classes of the DOM elements
function resetDOMClasses(classesToRemove) {
  const nav = document.getElementById('nav');
  classesToRemove.forEach((className) => {
    nav.querySelectorAll(`.${className}`).forEach((element) => {
      if (!element.classList.contains('sublist')) {
        element.classList.remove(className);
      }
      if (element.classList.contains('sublist', 'active')) {
        element.classList.remove('active');
        element.classList.add('remove');
      }
    });
  });
  nav.querySelector('.mobile-menu-item-drop .title').remove();
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

  // mobile menu
  const mobileMenu = nav.querySelector('nav .section:last-child');
  if (mobileMenu) {
    mobileMenu.classList.add('mobile-menu');
    mobileMenu.querySelector('ul').classList.add('mobile-menu-content');
  }

  const menuItems = nav.querySelectorAll('.mobile-menu-content > li');

  // decorate mobile menu
  menuItems.forEach((item) => {
    item.classList.add('mobile-menu-item');
    if (item.querySelector('ul')) {
      if (!item.classList.contains('mobile-menu-item-drop')) {
        item.classList.add('mobile-menu-item-drop');
      }
      item.querySelectorAll(':scope > ul').forEach((ul) => {
        ul.classList.add('list');
      });
    }
    const list = item.querySelectorAll('.mobile-menu-item-drop > ul > li');
    list.forEach((l) => {
      l.classList.add('list-items');
      const sublist = l.querySelector('ul');
      if (sublist) {
        l.classList.add('expand');
        sublist.classList.add('sublist');
        sublist.classList.add('remove');
        sublist.querySelectorAll('li').forEach((sublistItem) => {
          sublistItem.classList.add('sublist-items');
        });
      }

      const backArrow = document.createElement('button');
      backArrow.classList.add('back-arrow');
      if (l.classList.contains('active')) {
        l.classList.remove('active');
      }

      const innerBackArrow = document.createElement('button');
      innerBackArrow.classList.add('inner-back-arrow');

      let arrow = l.parentElement.parentElement.querySelector('.arrow');
      if (!arrow) {
        arrow = document.createElement('button');
        arrow.classList.add('arrow');
        l.parentElement.parentElement.appendChild(arrow);
        if (!arrow.dataset.listenerAdded) {
          arrow.addEventListener('click', (e) => handleForwardArrowClick(e, item, l, arrow, backArrow, innerBackArrow, mobileMenu));
          arrow.dataset.listenerAdded = 'true';
        }
      }
      if (l.querySelector('.sublist')) {
        const subl = l.querySelector('.sublist');
        const lArrow = document.createElement('button');
        lArrow.classList.add('inner-arrow');
        l.appendChild(lArrow);
        if (!lArrow.dataset.listenerAdded) {
          lArrow.addEventListener('click', (e) => {
            subl.classList.remove('remove');
            subl.classList.add('active');
            handleForwardArrowClick(e, item, l, arrow, backArrow, innerBackArrow, mobileMenu);
          });
          lArrow.dataset.listenerAdded = 'true';
        }
      }

      // back arrow handling
      backArrow.addEventListener('click', (e) => handleBackArrowClick(e, backArrow));

      // inner back arrow handling
      innerBackArrow.addEventListener('click', (e) => handleInnerBackArrowClick(e, backArrow));
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

  closeButton.addEventListener('click', () => {
    nav.setAttribute('aria-expanded', 'false');
    document.body.style.overflowY = '';
    mobileMenu.classList.add('closing');
    setTimeout(() => {
      mobileMenu.classList.remove('mobile-menu-open');

      if (mobileMenu.querySelector('.list.active')) {
        const inactiveSublist = mobileMenu.querySelectorAll('.sublist.remove');
        inactiveSublist.forEach((sublist) => {
          sublist.classList.add('remove');
        });
        resetDOMClasses(['active', 'remove', 'block']);
      } else {
        resetDOMClasses(['active', 'remove', 'block', 'expand']);
      }
    }, 500);
  });

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
          mobileMenu.classList.remove('closing');
        }, 0);
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

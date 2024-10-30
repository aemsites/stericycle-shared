import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { a, button, div, domEl, form, img, input, label, p, span, ul } from '../../scripts/dom-helpers.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 1200px)');

/**
 * Closes the entire nav on escape key press
 * @param {KeyboardEvent} e
 */
function closeNavOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    let expanded = navSections.querySelector('[aria-expanded="true"]');
    expanded = expanded || nav.querySelector('.nav-drop[aria-expanded="true"]');
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, isDesktop.matches);
    if (expanded && isDesktop.matches) {
      expanded.focus();
    } else {
      nav.querySelector('.nav-hamburger a').focus();
    }
  }
}

/**
 * Closes the entire mobile menus on escape key press
 * @param {KeyboardEvent} e
 */
function closeMobileMenuOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const icons = nav.querySelector('.mobile-icons');
    const menuExpanded = icons.querySelector('[aria-expanded="true"]');
    // eslint-disable-next-line no-use-before-define
    toggleMobileMenus(nav);
    if (menuExpanded) {
      menuExpanded.focus();
    }
  }
}

/**
 * Closes the entire nav when the focus is no longer in a sub-element
 * @param {FocusEvent} e
 */
function closeNavOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    // eslint-disable-next-line no-use-before-define
    toggleMenu(nav, isDesktop.matches);
  }
}

/**
 * Closes the entire mobile menus when the focus is no longer in a sub-element
 * @param {FocusEvent} e
 */
function closeMobileMenuOnFocusLost(e) {
  const nav = e.currentTarget;
  const expanded = nav.querySelector('[aria-expanded="true"]');
  if (!expanded?.contains(e.relatedTarget)) {
    // eslint-disable-next-line no-use-before-define
    toggleMobileMenus(nav);
  }
}

/**
 * Toggles the state of an expandable menu item based on keypress.
 * @param {KeyboardEvent} e
 */
function openNavOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleMenu(document.getElementById('nav'), isDesktop.matches);
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function openMobileMenuOnKeydown(e) {
  const focused = document.activeElement;
  const isController = focused.getAttribute('aria-controls');
  if (isController && (e.code === 'Enter' || e.code === 'Space')) {
    e.preventDefault();
    e.stopPropagation();
    const nav = focused.closest('nav');
    const controlled = nav.querySelector(`#${focused.getAttribute('aria-controls')}`);
    const isExpanded = controlled.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleMobileMenus(nav);
    controlled.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
    // eslint-disable-next-line no-use-before-define
    updateControlledState(controlled, !isExpanded);
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openNavOnKeydown);
}

function focusMobileMenu() {
  document.activeElement.addEventListener('keydown', openMobileMenuOnKeydown);
}

function mouseInNavSection(e) {
  // eslint-disable-next-line no-use-before-define
  const nav = document.getElementById('nav');
  nav.querySelectorAll('[aria-expanded="true"]').forEach((expanded) => {
    expanded.setAttribute('aria-expanded', 'false');
  });
  e.currentTarget.setAttribute('aria-expanded', 'true');
}

function mouseOutNavSection(e) {
  e.currentTarget.setAttribute('aria-expanded', 'false');
}

/**
 * Updates the controlled state of a pop-up menu item
 * @param {HTMLElement} controlled the element that contains the popup
 * @param {boolean} expanded if the popup should be expanded or collapsed
 */
function updateControlledState(controlled, expanded) {
  controlled.setAttribute('aria-expanded', expanded);
  if (expanded) {
    controlled.querySelector('input')?.setAttribute('tabindex', 0);
    controlled.querySelector('input')?.focus();
    controlled.querySelectorAll('a').forEach((btn) => {
      btn.setAttribute('tabindex', 0);
      btn.setAttribute('role', 'button');
    });
  } else {
    controlled.querySelector('input')?.setAttribute('tabindex', -1);
    controlled.querySelectorAll('a').forEach((btn) => {
      btn.setAttribute('tabindex', '-1');
      btn.removeAttribute('role');
    });
  }
}

/**
 * Toggles all nav sections
 * @param {Element} nav The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavDrops(nav, expanded = false) {
  nav.querySelectorAll('ul > li.nav-drop').forEach((drop) => {
    drop.setAttribute('aria-expanded', expanded);
    drop.querySelector('button')?.setAttribute('aria-label', expanded ? 'Expand' : 'Collapse');
    drop.querySelector('ul')?.classList.toggle('section-expanded', expanded);
  });
}

/**
 * Updates mobile menu state when menu is toggled
 * @param {Element} nav The container element
 */
function toggleMobileMenus(nav) {
  const controls = nav.querySelectorAll('.mobile-icons [aria-controls]');
  controls.forEach((control) => {
    if (isDesktop.matches) {
      control.removeAttribute('role');
      control.setAttribute('tabindex', -1);
      control.removeEventListener('focus', focusMobileMenu);
      window.removeEventListener('keydown', closeMobileMenuOnEscape);
      nav.removeEventListener('focusout', closeMobileMenuOnFocusLost);
    } else {
      control.setAttribute('role', 'button');
      control.setAttribute('tabindex', 0);
      control.addEventListener('focus', focusMobileMenu);
      window.addEventListener('keydown', closeMobileMenuOnEscape);
      // collapse menu on focus lost
      nav.addEventListener('focusout', closeMobileMenuOnFocusLost);
    }
    updateControlledState(nav.querySelector(`#${control.getAttribute('aria-controls')}`), false);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavDrops(nav);
  // enable nav dropdown keyboard accessibility
  const navDrops = nav.querySelectorAll('div[class|="nav"] > ul > .nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
      drop.querySelectorAll('li.nav-drop').forEach((subDrop) => {
        subDrop.setAttribute('aria-expanded', 'true');
      });
      drop.addEventListener('mouseenter', mouseInNavSection);
      drop.addEventListener('mouseleave', mouseOutNavSection);
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
      drop.querySelectorAll('li.nav-drop').forEach((subDrop) => {
        subDrop.setAttribute('aria-expanded', 'false');
      });
      drop.removeEventListener('mouseenter', mouseInNavSection);
      drop.removeEventListener('mouseleave', mouseOutNavSection);
    });
    nav.querySelector('#primary-nav .close').setAttribute('tabindex', expanded ? -1 : 0);
    nav.querySelector('#primary-nav').classList.toggle('section-expanded', false);
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeNavOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeNavOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeNavOnEscape);
    nav.removeEventListener('focusout', closeNavOnFocusLost);
  }
}

/**
 * Adds all the listeners to the Mobile nav elements
 * @param {HTMLElement} nav the root nav element
 */
function addMobileListeners(nav) {
  nav.querySelectorAll('.mobile-icons a[aria-controls]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const controller = e.currentTarget;
      const controlled = nav.querySelector(`#${controller.getAttribute('aria-controls')}`);
      const isExpanded = controlled.getAttribute('aria-expanded') === 'true';
      // eslint-disable-next-line no-use-before-define
      toggleMobileMenus(nav);
      controlled.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      // eslint-disable-next-line no-use-before-define
      updateControlledState(controlled, !isExpanded);
    });
    const close = btn.nextElementSibling.querySelector('a.close');
    if (close) {
      const closeMobileOnInteraction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenus(nav);
        const controlled = nav.querySelector(`#${btn.getAttribute('aria-controls')}`);
        updateControlledState(controlled, false);
      };
      close.addEventListener('click', closeMobileOnInteraction);
    }
  });

  nav.querySelector('.primary-nav-wrapper .close-button .close').addEventListener('click', () => {
    toggleMenu(nav);
  });
}

function closeOnInteraction(e, nav, btn) {
  if ((e.type === 'keydown' && e.code !== 'Escape')
    || (e.type === 'focusout' && e.relatedTarget?.closest('nav'))) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  toggleMenu(nav, true);
  const controlled = nav.querySelector(`#${btn.getAttribute('aria-controls')}`);
  updateControlledState(controlled, false);
}

function openTarget(e, nav) {
  e.preventDefault();
  e.stopPropagation();
  const controller = e.currentTarget;
  const controlled = nav.querySelector(`#${controller.getAttribute('aria-controls')}`);
  const isExpanded = controlled.getAttribute('aria-expanded') === 'true';
  // eslint-disable-next-line no-use-before-define
  toggleMenu(nav, true);
  controlled.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  // eslint-disable-next-line no-use-before-define
  updateControlledState(controlled, !isExpanded);
}

function addSearchListener(nav) {
  const btn = nav.querySelector('.nav-search.desktop-search > a');
  const callCloseOnInteraction = (e) => {
    closeOnInteraction(e, nav, btn);
    window.removeEventListener('keydown', callCloseOnInteraction);
    nav.removeEventListener('focusout', callCloseOnInteraction);
  };

  btn.addEventListener('click', (e) => {
    openTarget(e, nav);
    window.addEventListener('keydown', callCloseOnInteraction);
    nav.addEventListener('focusout', callCloseOnInteraction);
  });

  nav.querySelectorAll('.nav-search a[type="submit"]').forEach((submit) => {
    submit.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      submit.closest('form').submit();
    });
  });
  const close = nav.querySelector('.nav-search.desktop-search a.close');
  close.addEventListener('click', callCloseOnInteraction);
}

function addLocationListeners(nav) {
  const btn = nav.querySelector('.nav-locate > a');
  const callCloseOnInteraction = (e) => {
    closeOnInteraction(e, nav, btn);
    window.removeEventListener('keydown', callCloseOnInteraction);
    nav.removeEventListener('focusout', callCloseOnInteraction);
  };
  btn.addEventListener('click', (e) => {
    openTarget(e, nav);
    window.addEventListener('keydown', callCloseOnInteraction);
    nav.addEventListener('focusout', callCloseOnInteraction);
  });

  const locateForm = nav.querySelector('.nav-locate form');
  locateForm.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const { value } = locateForm.querySelector('input[type="text"]');
    window.location.href = `${locateForm.action}#${value}`;
    if (window.location.pathname === new URL(locateForm.action).pathname) window.location.reload();
    return false;
  });
}

function addDropButtons(navEl) {
  navEl.querySelectorAll(':scope ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) {
      navSection.classList.add('nav-drop');
      if (navSection.querySelector(':scope > a')) {
        navSection.querySelector(':scope > a').insertAdjacentElement('afterend', button({
          class: 'nav-drop-button',
          'aria-label': 'Expand',
        }));
      } else {
        const wrapper = span(navSection.childNodes[0].textContent);
        navSection.childNodes[0].remove();
        navSection.insertAdjacentElement('afterbegin', button({
          class: 'nav-drop-button',
          'aria-label': 'Expand',
        }));
        navSection.insertAdjacentElement('afterbegin', wrapper);
      }
    }
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';
  let locale = window.location.pathname.split('/')[1];
  locale = locale.match(/^[a-z]{2}-[a-z]{2}$/) ? locale : 'en-us'; // default to us-en if no locale in path
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : `/${locale}/nav`;
  const fragment = await loadFragment(navPath);

  const contactList = fragment.querySelector('.section[data-section="contact" i] ul');
  const navSections = fragment.querySelector('.section[data-section="sections" i]');
  navSections.replaceChildren(navSections.querySelector('ul'));
  navSections.classList.replace('section', 'nav-sections');

  const languages = fragment.querySelector('.section[data-section="languages" i]');
  const currLang = languages.querySelector(`a[href$="/${locale}"]`).closest('li');
  currLang.classList.add('nav-drop');
  currLang.setAttribute('aria-expanded', 'false');
  currLang.prepend(span('Country'));
  const navLanguages = div({ class: 'nav-languages' }, ul(currLang));
  currLang.append(languages.querySelector('ul'));

  const navTools = fragment.querySelector('.section[data-section="tools" i]');
  navTools.replaceChildren(navTools.querySelector('ul'));
  navTools.classList.replace('section', 'nav-tools');

  // @formatter:off
  /* eslint-disable function-paren-newline,function-call-argument-newline */
  const mobileSearch = div({ class: 'nav-search mobile-search' },
    a({ href: '#', class: 'icon-search', title: 'Search', 'aria-controls': 'mobile-search-popup' }, span('Search')),
    div({ class: 'search-form-wrapper', id: 'mobile-search-popup' },
      form({ class: 'search-form', action: `/${locale}/search`, method: 'get', autocomplete: 'off' },
        label({ for: 'siteSearch' }, 'Search Query'),
        input({ id: 'siteSearch', type: 'text', placeholder: 'Search', name: 'searchQuery', tabindex: '-1' }),
        a({ class: 'search-button', type: 'submit', 'aria-label': 'Search' }),
        a({ class: 'close', type: 'button', 'aria-label': 'Close' }),
      ),
    ),
  );

  const navSearch = mobileSearch.cloneNode(true);
  navSearch.classList.add('desktop-search');
  navSearch.querySelector('a').setAttribute('aria-controls', 'nav-search-popup');
  navSearch.querySelector('div').setAttribute('id', 'nav-search-popup');

  const navLocate = div({ class: 'nav-locate', id: 'nav-locate', 'aria-expanded': false },
    a({ href: '#', title: 'Find Your Service Center', 'aria-controls': 'nav-locate' }, 'Find Your Service Center'),
    div({ class: 'locate-popup' },
      span('Find Yours:'),
      form({ action: `/${locale}/service-locations`, method: 'get', autocomplete: 'off' },
        label({ for: 'searchLocationInput' }, 'Search by zip code, street, or city'),
        input({ id: 'searchLocationInput', type: 'text', name: 'searchQuery', placeholder: 'Search', required: true, pattern: '^.{4,}$' }),
        button({ type: 'submit', 'aria-label': 'Search for Location' }),
      ),
      a({ href: `/${locale}/service-locations`, 'aria-label': 'Service Locations' }, 'Service Locations'),
    ),
  );

  const nav = domEl('nav', { id: 'nav' },
    div({ class: 'logo' },
      a({ href: `/${locale}`, class: 'logo-link', title: 'Shred-it' },
        img({
          src: '/icons/shredit-logo.svg',
          alt: 'Paper Shredding & Document Destruction Services Near You. ',
        }),
      ),
    ),
    div({ class: 'mobile-icons' },
      mobileSearch,
      div({ class: 'mobile-contact' },
        a({ href: '#', class: 'icon-contact', title: 'Contact Us', 'aria-controls': 'mobile-contact-popup' }, span('Contact Us')),
        div({ id: 'mobile-contact-popup' },
          div({ class: 'contact-wrapper' }, contactList.cloneNode(true)),
        ),
      ),
    ),
    div({ class: 'nav-hamburger' },
      a({ href: '#', class: 'nav-hamburger-icon', title: 'Menu', 'aria-label': 'Menu', 'aria-controls': 'nav' }, span('Menu')),
    ),
    div({ class: 'primary-nav-wrapper', id: 'primary-nav' },
      div({ class: 'close-button' }, button({ class: 'close', 'aria-label': 'Close', tabIndex: '-1' })),
      div({ class: 'nav-contact' }, contactList),
      navSections,
      navLanguages,
      navLocate,
      navTools,
      navSearch,
      div({ class: 'quote-wrapper' },
        p({ class: 'button-container' },
          a({ href: '/forms/modals/modal', class: 'quote-button button primary', 'aria-label': 'Request a Free Quote' }, 'Request a Free Quote'),
        ),
      ),
    ),
  );
  /* eslint-enable function-paren-newline,function-call-argument-newline */
  // @formatter:on

  const hamburger = nav.querySelector('.nav-hamburger-icon');
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleMenu(nav);
  });
  hamburger.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      toggleMenu(nav);
      navSections.querySelector('a').focus();
    }
  });

  addDropButtons(navSections);
  addDropButtons(navLanguages);
  nav.querySelectorAll('.nav-drop button').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        e.stopPropagation();
        const drop = btn.closest('li');
        const expanded = drop.getAttribute('aria-expanded');
        drop.setAttribute('aria-expanded', expanded === 'true' ? 'false' : 'true');
        btn.setAttribute('aria-label', expanded === 'true' ? 'Expand' : 'Collapse');
        if (!isDesktop.matches) {
          // Find the correct parent to toggle a section expansion.
          if (btn.closest('ul').closest('ul > li.nav-drop')) {
            btn.closest('ul').closest('ul').classList.toggle('section-expanded', !expanded || expanded === 'false');
          } else {
            nav.querySelector('#primary-nav').classList.toggle('section-expanded', !expanded || expanded === 'false');
          }
        }
      }
    });
  });
  addMobileListeners(nav);
  addSearchListener(nav);
  addLocationListeners(nav);

  toggleMenu(nav, isDesktop.matches);
  toggleMobileMenus(nav);
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, isDesktop.matches);
    toggleMobileMenus(nav);
  });

  block.append(nav);
}

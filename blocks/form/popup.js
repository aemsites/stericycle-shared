import { loadCSS, fetchPlaceholders } from '../../scripts/aem.js';
import { getLocale } from '../../scripts/scripts.js';
import maskDecorate from './components/mask/mask.js';
import { appendFragment, checkValidation } from './lib/util.js';
import { submitForm } from './submit.js';

let popupDismissed = false;

function findField(items, name) {
  if (!items) return null;
  const direct = items.find((f) => f.name === name);
  if (direct) return direct;
  let nested = null;
  items.some((f) => {
    if (f.items) {
      nested = findField(f.items, name);
      return nested !== null;
    }
    return false;
  });
  return nested;
}

function findSubmitButton(items) {
  if (!items) return null;
  const direct = items.find((f) => f.fieldType === 'button' && f.buttonType === 'submit');
  if (direct) return direct;
  let nested = null;
  items.some((f) => {
    if (f.items) {
      nested = findSubmitButton(f.items);
      return nested !== null;
    }
    return false;
  });
  return nested;
}

function resolve(ph, raw, fallback) {
  if (!raw) return fallback;
  return ph[raw.toLowerCase()] || raw;
}

function buildInputAttrs(fd, ph, maskPlaceholder) {
  const type = (fd.fieldType || 'text').replace('-input', '');
  const parts = [
    'class="form-popup-input"',
    `id="popup-${fd.name}"`,
    `type="${type}"`,
    `name="${fd.name}"`,
    `placeholder="${maskPlaceholder || ' '}"`,
    'autocomplete="off"',
    fd.required ? 'required' : '',
    fd.maxLength ? `maxlength="${ph[String(fd.maxLength).toLowerCase()] || fd.maxLength}"` : '',
    fd.minLength ? `minlength="${ph[String(fd.minLength).toLowerCase()] || fd.minLength}"` : '',
    fd.pattern ? `pattern="${ph[fd.pattern.toLowerCase()] || fd.pattern}"` : '',
    fd.charset ? `data-charset="${resolve(ph, fd.charset, fd.charset)}"` : '',
    (fd.max !== undefined && fd.max !== '') ? `max="${fd.max}"` : '',
    (fd.min !== undefined && fd.min !== '') ? `min="${fd.min}"` : '',
    fd.enabled === false ? 'disabled' : '',
  ].filter(Boolean);
  return parts.join(' ');
}

function buildConstraintAttrs(fd, ph) {
  if (!fd?.constraintMessages) return '';
  const toKebab = (s) => s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  return Object.entries(fd.constraintMessages)
    .filter(([, v]) => v)
    .map(([k, v]) => `data-${toKebab(k)}-error-message="${resolve(ph, v, v)}"`)
    .join(' ');
}

function buildField(fd, ph, maskPlaceholder) {
  if (!fd) return '';
  const label = resolve(ph, fd.label?.value, null);
  const required = fd.required ? ' data-required="true"' : '';
  const constraintAttrs = buildConstraintAttrs(fd, ph);
  const input = buildInputAttrs(fd, ph, maskPlaceholder);
  return `<div class="form-popup-field field-wrapper"${required}${constraintAttrs ? ` ${constraintAttrs}` : ''}>`
    + `<input ${input}>${label ? `<label>${label}</label>` : ''}</div>`;
}

function applyMask(fieldEl) {
  maskDecorate(fieldEl);
}

function positionPopup(popup) {
  const header = document.querySelector('header');
  popup.style.top = `${(header ? header.getBoundingClientRect().bottom : 0) + 10}px`;
}

function buildPopupDOM(title, defs, ph, submitLabel) {
  const popup = document.createElement('div');
  popup.className = 'form-popup';
  popup.setAttribute('role', 'complementary');
  popup.setAttribute('aria-label', 'Quick form');

  const checkboxLabel = resolve(ph, defs.newslettersignup?.label?.value, 'I would like to receive Shred-it emails');
  const zipMask = resolve(ph, defs.zip?.placeholder, '_____') || '_____';
  const phoneMask = resolve(ph, defs.phone?.placeholder, '(___) ___-____') || '(___) ___-____';

  popup.innerHTML = `
    <div class="form-popup-header">
      <span class="form-popup-title">${title}</span>
      <button class="form-popup-close" type="button" aria-label="Close quick form">&#x2715;</button>
    </div>
    <form class="form-popup-inner" novalidate>
      <div class="form-popup-row">
        ${buildField(defs.zip, ph, zipMask)}
      </div>
      <div class="form-popup-extra-fields">
        <div class="form-popup-row form-popup-row-split">
          ${buildField(defs.first_name, ph)}
          ${buildField(defs.last_name, ph)}
        </div>
        <div class="form-popup-row form-popup-row-split">
          ${buildField(defs.email, ph)}
          ${buildField(defs.phone, ph, phoneMask)}
        </div>
        <label class="form-popup-checkbox-row">
          <input class="form-popup-checkbox" type="checkbox" name="newslettersignup" value="true" checked>
          <span class="form-popup-checkbox-label">${checkboxLabel}</span>
        </label>
      </div>
      <div class="form-popup-row">
        <button class="form-popup-submit" type="submit">${submitLabel}</button>
      </div>
      <div class="form-popup-notice"></div>
      <div class="form-popup-privacy"></div>
    </form>
  `;

  return popup;
}

export default async function initPopupForm(mainForm, cfg, formDef) {
  if (popupDismissed) return;
  if (document.querySelector('.form-popup')) return;

  loadCSS(`${window.hlx.codeBasePath}/blocks/form/popup.css`);

  const ph = await fetchPlaceholders(`/${getLocale()}`);

  const items = formDef?.items || [];
  const fieldNames = ['zip', 'first_name', 'last_name', 'email', 'phone', 'newslettersignup'];
  const defs = Object.fromEntries(fieldNames.map((name) => [name, findField(items, name)]));
  const privacyField = findField(items, 'privacy-policy');
  const noticeField = findField(items, 'ecommerce-notice');
  const submitBtn = findSubmitButton(items);
  const submitLabel = resolve(ph, submitBtn?.label?.value, 'Submit');

  const title = String(cfg['popup-form-title'] || 'Get a Quick Quote').trim();
  const popup = buildPopupDOM(title, defs, ph, submitLabel);
  document.body.appendChild(popup);

  // same helper the main form uses for its fragment fields (see createFragment in forms-common.js)
  appendFragment(popup.querySelector('.form-popup-privacy'), privacyField?.value);
  appendFragment(popup.querySelector('.form-popup-notice'), noticeField?.value);

  const zipField = popup.querySelector('[name="zip"]')?.closest('.form-popup-field');
  const phoneField = popup.querySelector('[name="phone"]')?.closest('.form-popup-field');
  if (zipField) applyMask(zipField);
  if (phoneField) applyMask(phoneField);

  const closeBtn = popup.querySelector('.form-popup-close');
  const zipInput = popup.querySelector('[name="zip"]');
  const popupForm = popup.querySelector('.form-popup-inner');

  popupForm.querySelectorAll('input').forEach((input) => {
    input.addEventListener('invalid', (e) => checkValidation(e.target));
  });
  popupForm.addEventListener('change', (e) => checkValidation(e.target));

  zipInput.addEventListener('focus', () => {
    popup.classList.add('form-popup-expanded');
  });

  ['action', 'redirectUrl', 'thankYouMsg', 'submitErrorMessage', 'source',
    'ecommerceEnable', 'ecommerceFlow'].forEach((key) => {
    if (mainForm.dataset[key] !== undefined) popupForm.dataset[key] = mainForm.dataset[key];
  });

  // Mirror the main form's hidden inputs: the UTM params decorateUTM appended to it, plus any
  // sheet-authored hidden fields. constructPayload iterates form.elements, so without these the
  // popup would POST without the attribution and context the main form sends.
  mainForm.querySelectorAll('input[type="hidden"]').forEach((input) => {
    if (input.name && !popupForm.elements.namedItem(input.name)) {
      popupForm.appendChild(input.cloneNode(true));
    }
  });

  popupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const valid = popupForm.checkValidity();
    if (!valid) {
      const firstInvalid = popupForm.querySelector(':invalid:not(fieldset)');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (popupForm.getAttribute('data-submitting') === 'true') return;
    popupForm.setAttribute('data-submitting', 'true');
    const submitEl = e.submitter || popupForm.querySelector('button[type="submit"]');
    if (submitEl) submitEl.disabled = true;

    await submitForm(e, popupForm, null);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        positionPopup(popup);
        popup.classList.add('form-popup-visible');
      } else if (entry.isIntersecting) {
        popup.classList.remove('form-popup-visible', 'form-popup-expanded');
      }
    });
  }, { root: null, threshold: 0 });

  observer.observe(mainForm);

  closeBtn.addEventListener('click', () => {
    popup.classList.remove('form-popup-visible');
    popupDismissed = true;
    observer.disconnect();
  });
}

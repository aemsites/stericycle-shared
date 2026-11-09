import { getLocale } from '../../../../scripts/scripts.js';

const masking = {
  maskedNumber: '_XdDmMyY9',
  maskedLetter: '_',

  init: (input) => {
    masking.createShell(input);
  },

  createShell: (input) => {
    const text = document.createElement('span');
    const placeholder = input.getAttribute('placeholder');

    let maxLength = placeholder?.length;
    if (input.dataset.type === 'postalCode') {
      // eslint-disable-next-line no-unsafe-optional-chaining
      maxLength = getLocale() === 'en-us' ? 5 : placeholder?.length + 1;
    }
    input.setAttribute('maxlength', maxLength);
    input.setAttribute('data-placeholder', placeholder);

    if (input.dataset.type === 'postalCode') {
      input.setAttribute('data-placeholder', placeholder);
    }

    text.className = 'shell';
    text.innerHTML = `<span aria-hidden="true" class="realMask" id="${input.id
    }Mask"><i></i>${placeholder}</span>`;

    input.insertAdjacentElement('beforebegin', text);
  },

  setValueOfMask: (e) => {
    const { value } = e.target;
    const placeholder = e.target.getAttribute('data-placeholder');

    return `<i>${value}</i>${placeholder.substr(value.length)}`;
  },

  activateMasking: (e) => {
    masking.handleValueChange(e);
  },

  handleValueChange: (e) => {
    const fieldWrapper = e.target.closest('.field-wrapper');
    const shell = fieldWrapper.querySelector('.shell');

    // eslint-disable-next-line default-case
    switch (e.keyCode) {
      case 20:
      case 17:
      case 18:
      case 16:
      case 37:
      case 38:
      case 39:
      case 40:
      case 9:
        return;
    }

    if (e.target.dataset.type === 'postalCode' && getLocale() === 'en-us') {
      e.target.setAttribute('maxlength', 5);
    }

    e.target.value = masking.handleCurrentValue(e);
    const setValueShell = shell && shell.querySelector('.realMask');
    setValueShell.innerHTML = masking.setValueOfMask(e);
  },

  handleCurrentValue: (e) => {
    const isCharsetPresent = e.target.getAttribute('data-charset');
    const placeholder = isCharsetPresent || e.target.getAttribute('data-placeholder');
    const { value } = e.target; const l = placeholder.length; let newValue = '';
    let i; let j;
    // strip special characters
    const strippedValue = isCharsetPresent ? value.replace(/\W/g, '') : value.replace(/\D/g, '');

    // eslint-disable-next-line no-plusplus
    for (i = 0, j = 0; i < l; i++) {
      // eslint-disable-next-line no-restricted-globals
      const isInt = !isNaN(parseInt(strippedValue[j], 10));
      const isLetter = strippedValue[j] ? strippedValue[j].match(/[A-Z]/i) : false;
      const matchesNumber = masking.maskedNumber.indexOf(placeholder[i]) >= 0;
      const matchesLetter = masking.maskedLetter.indexOf(placeholder[i]) >= 0;

      if ((matchesNumber && isInt) || (isCharsetPresent && matchesLetter && isLetter)) {
        // eslint-disable-next-line no-plusplus
        newValue += strippedValue[j++].toUpperCase();
        // eslint-disable-next-line max-len
      } else if ((!isCharsetPresent && !isInt && matchesNumber) || (isCharsetPresent && ((matchesLetter && !isLetter) || (matchesNumber && !isInt)))) {
        return newValue;
      } else {
        newValue += placeholder[i];
      }
      if (strippedValue[j] === undefined) {
        break;
      }
    }

    return newValue;
  },
};

export default function decorate(field) {
  field.classList.add('mask');
  const input = field?.querySelector('input');
  input.dataset.type = input?.type === 'tel' ? '' : 'postalCode';
  masking.init(input);
  input.addEventListener('input', (e) => masking.activateMasking(e));
  input.addEventListener('focus', () => { input.closest('.field-wrapper').classList.add('focus'); });
  input.addEventListener('blur', () => { input.closest('.field-wrapper').classList.remove('focus'); });
}

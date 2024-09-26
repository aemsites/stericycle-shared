import { decorateIcons } from '../../../../scripts/aem.js';
import { updateOrCreateInvalidMsg } from '../../lib/util.js';

const displayValidationMessage = (fieldDiv) => {
  const message = fieldDiv.dataset.requiredErrorMessage;
  updateOrCreateInvalidMsg(fieldDiv.closest('.panel-wrapper'), message);
};

export default async function decorate(fieldDiv, field) {
  const { icon } = field;
  if (icon) {
    // create a span element with the icon-${icon} class
    // remove all : from icon
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('icon', `icon-${icon.replaceAll(':', '')}`);
    // find a label element in the fieldDiv and insert the iconSpan as its first child
    const label = fieldDiv.querySelector('label');
    if (label) {
      label.insertBefore(iconSpan, label.firstChild);
    }
    decorateIcons(fieldDiv);
    fieldDiv.classList.add('radio-icon');
  }

  const input = fieldDiv.querySelector('input');
  input.addEventListener('invalid', () => displayValidationMessage(fieldDiv));
  return fieldDiv;
}

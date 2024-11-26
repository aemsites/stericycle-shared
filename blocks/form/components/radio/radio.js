import { decorateIcons } from '../../../../scripts/aem.js';

export default async function decorate(fieldDiv, field, container) {
  const { icon } = field;
  if (icon) {
    // create a span element with the icon-${icon} class
    // remove all : from icon
    const iconSpan = document.createElement('span');
    iconSpan.classList.add('icon', `icon-${icon.replaceAll(':', '')}`);
    // find a label element in the fieldDiv and insert the iconSpan as its first child
    const label = fieldDiv.querySelector('label');
    if (label) {
      const p = document.createElement('p'); // adding p tag to center the text inside label
      p.textContent = label.textContent;
      label.textContent = '';
      label.appendChild(p);
      label.insertBefore(iconSpan, label.firstChild);
    }
    decorateIcons(fieldDiv);
    fieldDiv.classList.add('radio-icon');
  }
  container.dataset.required = field.required;
  return fieldDiv;
}

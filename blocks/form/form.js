import { extractFormDefinition as extractSheetDefinition, renderForm as renderDocForm } from './lib/docform.js';
import decorateUTM from './utm.js';
import { buildBlock, getMetadata } from '../../scripts/aem.js';

export default async function decorate(block) {
  const { container, formDef } = await extractSheetDefinition(block);
  if (formDef && formDef.properties?.source === 'sheet') {
    const form = await renderDocForm(formDef);
    await decorateUTM(form);
    if (form) {
      container.replaceWith(form);
      const inputs = form.querySelectorAll('.field-wrapper input');
      const excludeTypes = ['checkbox', 'radio'];
      inputs.forEach((input) => {
        if (!excludeTypes.includes(input.type)) {
          const wrapper = input.closest('.field-wrapper');
          wrapper.insertAdjacentElement('afterbegin', input);
          wrapper.classList.add('floating-field');
          if (!input.placeholder) {
            input.placeholder = '';
          }
        }
      });
      const fieldsets = document.querySelectorAll('fieldset[class*="field-requesttype"]');
      fieldsets.forEach((fieldset) => {
        fieldset.classList.add('splitbuttons');
      });

      // Move radio-wrapper elements into a radio-wrapper-container div
      form.querySelectorAll('fieldset.splitbuttons').forEach((fieldset) => {
        const radioWrappers = fieldset.querySelectorAll('.radio-wrapper');
        const radioWrapperContainer = fieldset.querySelector('.radio-wrapper-container');
        if (radioWrappers.length > 0 && !radioWrapperContainer) {
          const wrapperDiv = document.createElement('div');
          wrapperDiv.classList.add('radio-wrapper-container');
          const legend = fieldset.querySelector('legend');
          radioWrappers.forEach((radioWrapper) => {
            wrapperDiv.appendChild(radioWrapper);
          });
          fieldset.innerHTML = '';
          fieldset.appendChild(legend);
          fieldset.appendChild(wrapperDiv);
        }
      });
    }
  }
}

export function createFormFromMetadata() {
  const formPath = getMetadata('form-path');
  const formStyleClass = getMetadata('form-style');
  const element = { elems: !formPath ? [] : [`<a href="${formPath}"></a>`] };
  const form = buildBlock(formPath ? 'form' : 'get-a-quote-form', element);
  if (formPath && formStyleClass) {
    const classes = formStyleClass.split(',').map((cls) => cls.trim());
    classes.forEach((cls) => form.classList.add(cls));
  }
  return form;
}

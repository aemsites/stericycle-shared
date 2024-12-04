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

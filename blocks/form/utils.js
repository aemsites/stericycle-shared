import { buildBlock, getMetadata } from '../../scripts/aem.js';

export function getFormName(form) {
  let formName;
  if (form?.closest('.modal')) { // for form inside a modal check for this hidden field
    formName = form?.querySelector('input[name="modalFormName"]')?.value;
  }
  if (!formName) {
    formName = form?.querySelector('input[name="EloquaFormName"]')?.value || form?.dataset.action;
  }
  // eslint-disable-next-line consistent-return
  return formName;
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

export function getTriggerTypeForAnalytics(type) {
  if (type === 'time') {
    return 'pageTime';
  } if (type === 'exit') {
    return 'exitIntent';
  }
  return type;
}

import {
  createButton, createFieldWrapper, createLabel, getHTMLRenderType,
  createHelpText,
  getId,
  stripTags,
  checkValidation,
  toClassName, appendFragment,
} from './util.js';
import GoogleReCaptcha from '../integrations/recaptcha.js';
import componentDecorator from '../mappings.js';
import transferRepeatableDOM from '../components/repeat/repeat.js';
import { emailPattern, googleReCaptchaKey } from '../constant.js';

let captchaField;

const withFieldWrapper = (element) => (fd) => {
  const wrapper = createFieldWrapper(fd);
  wrapper.append(element(fd));
  return wrapper;
};

function setPlaceholder(element, fd) {
  if (fd.placeholder) {
    element.setAttribute('placeholder', fd.placeholder);
  }
}

const constraintsDef = Object.entries({
  'password|tel|email|text': [['maxLength', 'maxlength'], ['minLength', 'minlength'], 'pattern'],
  'number|range|date': [['maximum', 'Max'], ['minimum', 'Min'], 'step'],
  file: ['accept', 'Multiple'],
  panel: [['maxOccur', 'data-max'], ['minOccur', 'data-min']],
}).flatMap(([types, constraintDef]) => types.split('|')
  .map((type) => [type, constraintDef.map((cd) => (Array.isArray(cd) ? cd : [cd, cd]))]));

const constraintsObject = Object.fromEntries(constraintsDef);

function setConstraints(element, fd) {
  const renderType = getHTMLRenderType(fd);
  const constraints = constraintsObject[renderType];
  if (constraints) {
    constraints
      .filter(([nm]) => fd[nm])
      .forEach(([nm, htmlNm]) => {
        element.setAttribute(htmlNm, fd[nm]);
      });
  }
}

function createInput(fd) {
  const input = document.createElement('input');
  input.type = getHTMLRenderType(fd);
  setPlaceholder(input, fd);
  setConstraints(input, fd);
  return input;
}

const createTextArea = withFieldWrapper((fd) => {
  const input = document.createElement('textarea');
  setPlaceholder(input, fd);
  return input;
});

const createSelect = withFieldWrapper((fd) => {
  const select = document.createElement('select');
  select.required = fd.required;
  select.title = fd.tooltip ? stripTags(fd.tooltip, '') : '';
  select.readOnly = fd.readOnly;
  select.multiple = fd.type === 'string[]' || fd.type === 'boolean[]' || fd.type === 'number[]';
  let ph;
  if (fd.placeholder) {
    ph = document.createElement('option');
    ph.textContent = fd.placeholder;
    ph.setAttribute('disabled', '');
    ph.setAttribute('value', '');
    select.append(ph);
  }
  let optionSelected = false;

  const addOption = (label, value) => {
    const option = document.createElement('option');
    option.textContent = label instanceof Object ? label?.value?.trim() : label?.trim();
    option.value = value?.trim() || label?.trim();
    if (fd.value === option.value || (Array.isArray(fd.value) && fd.value.includes(option.value))) {
      option.setAttribute('selected', '');
      optionSelected = true;
    }
    select.append(option);
    return option;
  };

  const options = fd?.enum || [];
  const optionNames = fd?.enumNames ?? options;

  if (options.length === 1
    && options?.[0]?.startsWith('https://')) {
    const optionsUrl = new URL(options?.[0]);
    // using async to avoid rendering
    if (optionsUrl.hostname.endsWith('hlx.page')
    || optionsUrl.hostname.endsWith('hlx.live')) {
      fetch(`${optionsUrl.pathname}${optionsUrl.search}`)
        .then(async (response) => {
          const json = await response.json();
          const values = [];
          json.data.forEach((opt) => {
            addOption(opt.Option, opt.Value);
            values.push(opt.Value || opt.Option);
          });
        });
    }
  } else {
    options.forEach((value, index) => addOption(optionNames?.[index], value));
  }

  if (ph && optionSelected === false) {
    ph.setAttribute('selected', '');
  }
  return select;
});

function createHeading(fd) {
  const wrapper = createFieldWrapper(fd);
  const heading = document.createElement('h2');
  heading.textContent = fd.value || fd.label.value;
  heading.id = fd.id;
  wrapper.append(heading);

  return wrapper;
}

function createHidden(fd) {
  const input = createInput(fd);
  input.value = fd.value;
  input.name = fd.name;
  input.id = fd.id;
  return input;
}

function createFragment(fd) {
  const wrapper = createFieldWrapper(fd);
  wrapper.id = fd.Id;
  appendFragment(wrapper, fd.value);
  return wrapper;
}

function createRadioOrCheckbox(fd) {
  const wrapper = createFieldWrapper(fd);
  const input = createInput(fd);
  const [value, uncheckedValue] = fd.enum || [];
  input.value = value;
  if (typeof uncheckedValue !== 'undefined') {
    input.dataset.uncheckedValue = uncheckedValue;
  }
  wrapper.insertAdjacentElement('afterbegin', input);
  return wrapper;
}

function createLegend(fd) {
  return createLabel(fd, 'legend');
}

function createFieldSet(fd) {
  const wrapper = createFieldWrapper(fd, 'fieldset', createLegend);
  wrapper.id = fd.id;
  wrapper.name = fd.name;
  if (fd.fieldType === 'panel') {
    wrapper.classList.add('panel-wrapper');
  }
  if (fd.repeatable === true) {
    setConstraints(wrapper, fd);
    wrapper.dataset.repeatable = true;
    wrapper.dataset.index = fd.index || 0;
  }
  return wrapper;
}

function setConstraintsMessage(field, messages = {}) {
  Object.keys(messages).forEach((key) => {
    field.dataset[`${key}ErrorMessage`] = messages[key];
  });
}

function createRadioOrCheckboxGroup(fd) {
  const wrapper = createFieldSet({ ...fd });
  const type = fd.fieldType.split('-')[0];
  fd.enum.forEach((value, index) => {
    const label = (typeof fd.enumNames?.[index] === 'object' && fd.enumNames?.[index] !== null) ? fd.enumNames[index].value : fd.enumNames?.[index] || value;
    const id = getId(fd.name);
    const field = createRadioOrCheckbox({
      name: fd.name,
      id,
      label: { value: label },
      fieldType: type,
      enum: [value],
      required: fd.required,
    });
    field.classList.remove('field-wrapper', `field-${toClassName(fd.name)}`);
    const input = field.querySelector('input');
    input.id = id;
    input.dataset.fieldType = fd.fieldType;
    input.name = fd.name;
    input.checked = Array.isArray(fd.value) ? fd.value.includes(value) : value === fd.value;
    if ((index === 0 && type === 'radio') || type === 'checkbox') {
      input.required = fd.required;
    }
    if (fd.enabled === false || fd.readOnly === true) {
      input.setAttribute('disabled', 'disabled');
    }
    wrapper.appendChild(field);
  });
  wrapper.dataset.required = fd.required;
  if (fd.tooltip) {
    wrapper.title = stripTags(fd.tooltip, '');
  }
  setConstraintsMessage(wrapper, fd.constraintMessages);
  return wrapper;
}

function createPlainText(fd) {
  const paragraph = document.createElement('p');
  if (fd.richText) {
    paragraph.innerHTML = stripTags(fd.value);
  } else {
    paragraph.textContent = fd.value;
  }
  const wrapper = createFieldWrapper(fd);
  wrapper.id = fd.id;
  wrapper.replaceChildren(paragraph);
  return wrapper;
}

function createImage(fd) {
  const field = createFieldWrapper(fd);
  const imagePath = fd.source || fd.properties['fd:repoPath'] || '';
  const image = `
  <picture>
    <source srcset="${imagePath}?width=2000&optimize=medium" media="(min-width: 600px)">
    <source srcset="${imagePath}?width=750&optimize=medium">
    <img alt="${fd.altText || fd.name}" src="${imagePath}?width=750&optimize=medium">
  </picture>`;
  field.innerHTML = image;
  return field;
}

const fieldRenderers = {
  'drop-down': createSelect,
  'plain-text': createPlainText,
  checkbox: createRadioOrCheckbox,
  button: createButton,
  multiline: createTextArea,
  panel: createFieldSet,
  radio: createRadioOrCheckbox,
  fragment: createFragment,
  'radio-group': createRadioOrCheckboxGroup,
  'checkbox-group': createRadioOrCheckboxGroup,
  image: createImage,
  heading: createHeading,
  hidden: createHidden,
};

function colSpanDecorator(field, element) {
  const colSpan = field['Column Span'] || field.properties?.colspan;
  if (colSpan && element) {
    element.classList.add(`col-${colSpan}`);
  }
}

const handleFocus = (input, field) => {
  const editValue = input.getAttribute('edit-value');
  input.type = field.type;
  input.value = editValue;
};

const handleFocusOut = (input) => {
  const displayValue = input.getAttribute('display-value');
  input.type = 'text';
  input.value = displayValue;
};

function inputDecorator(field, element) {
  const input = element?.querySelector('input,textarea,select');
  if (input) {
    input.id = field.id;
    input.name = field.name;
    if (field.tooltip) {
      input.title = stripTags(field.tooltip, '');
    }
    input.readOnly = field.readOnly;
    input.autocomplete = field.autoComplete ?? 'off';
    input.disabled = field.enabled === false;
    if (field.fieldType === 'drop-down' && field.readOnly) {
      input.disabled = true;
    }
    const fieldType = getHTMLRenderType(field);
    if (['number', 'date', 'text', 'email'].includes(fieldType) && (field.displayFormat || field.displayValueExpression)) {
      field.type = fieldType;
      input.setAttribute('edit-value', field.value ?? '');
      input.setAttribute('display-value', field.displayValue ?? '');
      input.type = 'text';
      input.value = field.displayValue ?? '';
      input.addEventListener('touchstart', () => { input.type = field.type; }); // in mobile devices the input type needs to be toggled before focus
      input.addEventListener('focus', () => handleFocus(input, field));
      input.addEventListener('blur', () => handleFocusOut(input));
    } else if (input.type !== 'file') {
      input.value = field.value ?? '';
      if (input.type === 'radio' || input.type === 'checkbox') {
        input.value = field?.enum?.[0] ?? 'true';
        input.checked = field.checked;
      }
    } else {
      input.multiple = field.type === 'file[]';
    }
    if (field.required) {
      input.setAttribute('required', 'required');
    }
    if (field.description) {
      input.setAttribute('aria-describedby', `${field.id}-description`);
    }
    if (field.minItems) {
      input.dataset.minItems = field.minItems;
    }
    if (field.maxItems) {
      input.dataset.maxItems = field.maxItems;
    }
    if (field.maxFileSize) {
      input.dataset.maxFileSize = field.maxFileSize;
    }
    if (field.default !== undefined) {
      input.setAttribute('value', field.default);
    }
    if (input.type === 'email') {
      input.pattern = emailPattern || '';
    }
    setConstraintsMessage(element, field.constraintMessages);
    element.dataset.required = field.required;
  }
}

function renderField(fd) {
  const fieldType = fd?.fieldType?.replace('-input', '') ?? 'text';
  const renderer = fieldRenderers[fieldType];
  let field;
  if (typeof renderer === 'function') {
    field = renderer(fd);
  } else {
    field = createFieldWrapper(fd);
    field.append(createInput(fd));
  }
  if (fd.description) {
    field.append(createHelpText(fd));
    field.dataset.description = fd.description; // In case overriden by error message
  }
  if (fd.fieldType !== 'radio-group' && fd.fieldType !== 'checkbox-group') {
    inputDecorator(fd, field);
  }
  return field;
}

export async function generateFormRendition(panel, container, getItems = (p) => p?.items) {
  const items = getItems(panel) || [];
  const promises = items.map(async (field) => {
    field.value = field.value ?? '';
    const { fieldType } = field;
    if (fieldType === 'captcha') {
      captchaField = field;
    } else {
      const element = renderField(field);
      if (field.appliedCssClassNames) {
        element.className += ` ${field.appliedCssClassNames}`;
      }
      colSpanDecorator(field, element);
      if (field?.fieldType === 'panel') {
        await generateFormRendition(field, element, getItems);
        return element;
      }
      await componentDecorator(element, field, container);
      return element;
    }
    return null;
  });

  const children = await Promise.all(promises);
  container.append(...children.filter((_) => _ != null));
  await componentDecorator(container, panel);
}

function enableValidation(form) {
  form.querySelectorAll('input,textarea,select').forEach((input) => {
    input.addEventListener('invalid', (event) => {
      checkValidation(event.target);
    });
  });

  form.addEventListener('change', (event) => {
    checkValidation(event.target);
  });
}

async function handleSubmit(e, form, captcha, submitHandler) {
  e.preventDefault();
  const hiddenFields = form.querySelectorAll('[data-visible="false"]');
  hiddenFields.forEach(((field) => { field.disabled = true; })); // disabled fields are skipped for validation
  const valid = form.checkValidity();
  hiddenFields.forEach(((field) => { field.disabled = false; })); // re-enable them post validation check
  if (valid) {
    e.submitter?.setAttribute('disabled', '');
    if (form.getAttribute('data-submitting') !== 'true') {
      form.setAttribute('data-submitting', 'true');

      // hide error message in case it was shown before
      form.querySelectorAll('.form-message.show').forEach((el) => el.classList.remove('show'));

      if (typeof submitHandler === 'function') {
        await submitHandler({
          formEl: form,
          captcha,
        });
      }
    }
  } else {
    const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
    if (firstInvalidEl) {
      firstInvalidEl.focus();
      firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

export async function createForm(formDef, data, {
  submitHandler,
  onFormLoad,
}) {
  const form = document.createElement('form');
  form.noValidate = true;
  if (formDef.appliedCssClassNames) {
    form.className = formDef.appliedCssClassNames;
  }
  await generateFormRendition(formDef, form);

  let captcha;
  if (captchaField || googleReCaptchaKey) {
    const siteKey = captchaField?.properties?.['fd:captcha']?.config?.siteKey || captchaField?.value;
    captcha = new GoogleReCaptcha(siteKey || googleReCaptchaKey, captchaField?.id);
    captcha.loadCaptcha(form);
  }

  enableValidation(form);
  transferRepeatableDOM(form);

  form.dataset.redirectUrl = formDef.redirectUrl || '';
  form.dataset.thankYouMsg = formDef.thankYouMsg || '';
  form.dataset.submitErrorMessage = formDef.submitErrorMessage || '';
  form.dataset.action = formDef.action || '';
  if (typeof onFormLoad === 'function') {
    await onFormLoad({
      formEl: form,
      data,
      captcha,
    });
  }

  form.addEventListener('reset', async () => {
    const newForm = await createForm(formDef, data, onFormLoad);
    document.querySelector(`[data-action="${formDef.action}"]`).replaceWith(newForm);
  });

  form.addEventListener('submit', (e) => {
    handleSubmit(e, form, captcha, submitHandler);
  });

  return form;
}

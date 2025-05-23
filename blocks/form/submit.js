import { getSubmitBaseUrl } from './constant.js';
import { appendFragment } from './lib/util.js';
import { getMetadata } from '../../scripts/aem.js';
import { sendDigitalDataEvent } from '../../scripts/martech.js';
import { getFormName } from './utils.js';

function sendDataToAnalytics(form) {
  const quoteTypeField = form.querySelectorAll("input[name='quote_type'], input[name='Quote_Type'], input[name='QuoteType']");
  let quoteType = '';
  if (quoteTypeField) {
    quoteTypeField.forEach((option) => {
      const value = option?.value;
      if (option.type === 'hidden' || option.checked || option.selected) {
        if (value) {
          // eslint-disable-next-line no-unsafe-optional-chaining
          quoteType = value?.charAt(0)?.toUpperCase() + value?.slice(1);
        }
      }
    });
  }

  const serviceTypeField = form.querySelectorAll("input[name='serviceType1']");
  let serviceType;
  if (serviceTypeField) {
    serviceTypeField.forEach((option) => {
      const value = option?.value;
      if (option.type === 'hidden' || option.checked || option.selected) {
        if (value) {
          // eslint-disable-next-line no-unsafe-optional-chaining
          serviceType = value?.charAt(0)?.toUpperCase() + value?.slice(1);
        }
      }
    });
  }
  sendDigitalDataEvent({
    event: 'formSubmit',
    formName: getFormName(form),
    formElement: form,
    quoteType,
    serviceType,
  });
}

// eslint-disable-next-line no-unused-vars
export async function submitSuccess(e, form) {
  // remove error message if exists
  const errorMessage = form.querySelector('.form-message.error-message');
  if (errorMessage) {
    errorMessage.remove();
  }
  sessionStorage.setItem('formSubmitted', 'true');
  const { payload } = e;
  const thankYouMessageURL = payload?.body?.thankYouMessage;
  if (thankYouMessageURL) {
    let thankYouMsgEl = form.parentNode.querySelector('.form-message.success-message');
    if (!thankYouMsgEl) {
      thankYouMsgEl = document.createElement('div');
      thankYouMsgEl.className = 'form-message success-message';
    }
    const currentWizardPanel = form.querySelector('.current-wizard-step');
    if (currentWizardPanel) {
      currentWizardPanel.querySelectorAll('.field-wrapper').forEach((node) => { node.dataset.visible = 'false'; });
      await appendFragment(thankYouMsgEl, thankYouMessageURL);
      currentWizardPanel.append(thankYouMsgEl);
      form.querySelector('.wizard-button-prev').dataset.visible = 'false';
      form.querySelector('.wizard-button-next').dataset.visible = 'false';
      form.querySelector('.submit-wrapper').dataset.visible = 'false';
      const formName = getFormName(form);
      sendDigitalDataEvent({
        event: 'nextStep',
        formName,
        formStep: (parseInt(currentWizardPanel.dataset?.index, 10) + 1).toString(), // thank you message is displayed in the last step of the wizard
      });
    } else {
      form.querySelectorAll('.field-wrapper:not(.field-header)').forEach((node) => { node.dataset.visible = 'false'; });
      await appendFragment(thankYouMsgEl, payload?.body?.thankYouMessage);
      form.append(thankYouMsgEl);
    }
    form.reset();
  }
  form.setAttribute('data-submitting', 'false');
  form.querySelector('button[type="submit"]').disabled = false;
  sendDataToAnalytics(form);
}

// eslint-disable-next-line no-unused-vars
export async function submitFailure(e, form) {
  form.classList.add('submit-failure');
  const { payload } = e;
  let errorMessage = form.querySelector('.form-message.error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.className = 'form-message error-message';
  }
  await appendFragment(errorMessage, payload?.submitErrorMessage);
  form.prepend(errorMessage);
  form.setAttribute('data-submitting', 'false');
  form.querySelector('button[type="submit"]').disabled = false;
}

function generateUnique() {
  return new Date().valueOf() + Math.random();
}

function getFieldValue(fe, payload) {
  if (fe.type === 'radio') {
    return fe.form.elements[fe.name].value;
  } if (fe.type === 'checkbox') {
    if (fe.checked) {
      if (payload[fe.name]) {
        return `${payload[fe.name]},${fe.value}`;
      }
      return fe.value;
    }
    return 'false';
  } if (fe.type !== 'file') {
    return fe.value;
  }
  return null;
}

function getCountryAndLanguage() {
  const locale = getMetadata('locale');
  return locale?.split('-') || ['en', 'us'];
}

function getGoogleAdWordsClickID() {
  const cookies = document.cookie.split(';');
  return cookies?.find((row) => row.includes('gclid='))?.split('=')[1];
}

async function constructPayload(form, captcha) {
  const [language, country] = getCountryAndLanguage();
  const payload = {
    __id__: generateUnique(),
    ':currentPagePath': '/content/shred-it/us/en',
    currentPagePath: window.location.pathname,
    jobPropertiesUrl: `https://main--shredit--stericycle.aem.page${form.dataset.action}.json`,
    formName: form.dataset?.action,
    formURL: window.location.href,
    webCountry: country,
    webLanguage: language,
    googleAdwordsClickID1: getGoogleAdWordsClickID(),
  };
  [...form.elements].forEach((fe) => {
    if (fe.name && !fe.matches('button') && !fe.disabled && fe.tagName !== 'FIELDSET') {
      const value = getFieldValue(fe, payload);
      if (fe.closest('.repeat-wrapper')) {
        payload[fe.name] = payload[fe.name] ? `${payload[fe.name]},${fe.value}` : value;
      } else {
        payload[fe.name] = value;
      }
    }
  });

  if (captcha) {
    const token = await captcha.getToken();
    payload['g-recaptcha-response'] = token;
  }
  return { payload };
}

function createFormData(payload) {
  const formData = new FormData();
  Object.keys(payload).forEach((key) => {
    formData.append(key, payload[key]);
  });
  return formData;
}

async function prepareRequest(form, captcha) {
  const { payload } = await constructPayload(form, captcha);
  const headers = {
    'Content-Type': 'application/json',
  };
  const body = { data: payload };
  const url = `${getSubmitBaseUrl()}/bin/edgedelivery/form`;
  return { headers, body, url };
}

export async function submitForm(form, captcha) {
  try {
    // eslint-disable-next-line no-unused-vars
    const { headers, body, url } = await prepareRequest(form, captcha);
    const formData = createFormData(body.data);
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      submitSuccess(
        {
          payload: {
            body: {
              thankYouMessage: form.dataset.thankYouMsg,
              redirectUrl: form.dataset.redirectUrl,
            },
          },
        },
        form,
      );
    } else {
      submitFailure({
        payload: {
          submitErrorMessage: form.dataset.submitErrorMessage,
        },
      }, form);
    }
  } catch (error) {
    submitFailure({
      payload: {
        submitErrorMessage: form.dataset.submitErrorMessage,
      },
    }, form);
  }
}

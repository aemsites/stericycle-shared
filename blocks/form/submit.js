import { getSubmitBaseUrl } from './constant.js';
import { appendFragment } from './lib/util.js';
import { getMetadata } from '../../scripts/aem.js';
import { sendDigitalDataEvent, sendEcommEntryPointEvent } from '../../scripts/martech.js';
import { getFormName } from './utils.js';
import { resolveEcommerceRedirectUrl, resolveServiceLine } from './ecommerce.js';

/**
 * Read the first matching form control by candidate name(s), with an optional fallback selector.
 * Field names are author-driven (sheet-defined), so the candidate lists are best-effort and
 * pending confirmation with the analytics team / form authors (see STERICMS-1011 comms doc).
 */
function findControl(form, names, extraSelector) {
  const parts = names.map((n) => `[name="${n}"]`);
  if (extraSelector) parts.push(extraSelector);
  return form.querySelector(parts.join(', '));
}

/** Y/N presence flag for a control's value — used for PII fields; never emits the raw value. */
function presenceFlag(el) {
  return el && `${el.value ?? ''}`.trim() !== '' ? 'Y' : 'N';
}

/** Trimmed value of the first matching control, or '' when absent/empty. */
function readValue(form, names, extraSelector) {
  const el = findControl(form, names, extraSelector);
  return `${el?.value ?? ''}`.trim();
}

/** Value of the checked radio/checkbox inside a fieldset matched by a class fragment. */
function readFieldsetValue(form, classFragment) {
  const fieldset = form.querySelector(`fieldset[class*="${classFragment}"]`);
  return fieldset?.querySelector('input:checked')?.value || '';
}

/** modal vs inline, from the form's placement. */
function getFormType(form) {
  return form.closest('.modal') ? 'modal' : 'inline';
}

/** header / footer / body, from the form's placement. */
function getFormSource(form) {
  if (form.closest('header, .header')) return 'header';
  if (form.closest('footer, .footer')) return 'footer';
  return 'body';
}

/**
 * Collect the shared lead-form data points (used by both the BR.430 formSubmit event and the
 * BR.410 eComm entry-point event). PII fields are Y/N presence flags only — never raw values.
 * @param {HTMLFormElement} form
 */
function collectLeadDataPoints(form) {
  return {
    serviceAddress: readValue(form, ['serviceAddress', 'address', 'streetAddress', 'street_address', 'Address', 'address1']),
    zipCode: readValue(form, ['zip', 'zipCode', 'zipcode', 'postalCode', 'postal_code', 'Zip']),
    serviceLine: resolveServiceLine(form),
    requestType: readFieldsetValue(form, 'field-requesttype'),
    frequency: readFieldsetValue(form, 'field-frequncy'),
    FN: presenceFlag(findControl(form, ['firstName', 'first_name', 'FirstName', 'fname'], '[autocomplete="given-name"]')),
    LN: presenceFlag(findControl(form, ['lastName', 'last_name', 'LastName', 'lname'], '[autocomplete="family-name"]')),
    Email: presenceFlag(findControl(form, ['email', 'emailAddress', 'Email', 'email_address'], 'input[type="email"]')),
    Phone: presenceFlag(findControl(form, ['phone', 'phoneNumber', 'Phone', 'phone_number'], 'input[type="tel"]')),
  };
}

/**
 * Fire the BR.430 `formSubmit` analytics event with the lead-form data points (STERICMS-1011).
 * PII fields (FN/LN/Email/Phone) are emitted as Y/N presence flags only. `leadId` is not
 * available client-side yet (the submit response body is not returned to the client) — it is
 * passed through here so it can be wired once the backend returns it (see comms doc).
 * @param {HTMLFormElement} form
 * @param {{ eCommEntryPoint?: 'Y'|'N', leadId?: string|null }} [options]
 */
function sendDataToAnalytics(form, options = {}) {
  const { eCommEntryPoint = 'N', leadId = null } = options;

  const quoteTypeField = form.querySelectorAll("input[name='quote_type'], input[name='Quote_Type'], input[name='QuoteType']");
  let quoteType = '';
  quoteTypeField.forEach((option) => {
    const value = option?.value;
    if (option.type === 'hidden' || option.checked || option.selected) {
      if (value) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        quoteType = value?.charAt(0)?.toUpperCase() + value?.slice(1);
      }
    }
  });

  const serviceTypeField = form.querySelectorAll("input[name='serviceType1']");
  let serviceType;
  serviceTypeField.forEach((option) => {
    const value = option?.value;
    if (option.type === 'hidden' || option.checked || option.selected) {
      if (value) {
        // eslint-disable-next-line no-unsafe-optional-chaining
        serviceType = value?.charAt(0)?.toUpperCase() + value?.slice(1);
      }
    }
  });

  // serviceAddress is intentionally excluded from the formSubmit event per PII request
  // (Ivan, STERICMS-1011); it remains on the BR.410 entry-point events. ignoreRestSiblings
  // keeps the unused `serviceAddress` binding lint-clean.
  const { serviceAddress, ...formSubmitData } = collectLeadDataPoints(form);
  sendDigitalDataEvent({
    event: 'formSubmit',
    eventName: 'formSubmit',
    formName: getFormName(form),
    formElement: form,
    quoteType,
    serviceType,
    // BR.430 data points (formType already whitelisted; PII fields are Y/N flags via collect*)
    formType: getFormType(form),
    formSource: getFormSource(form),
    leadId,
    eCommEntryPoint,
    ...formSubmitData,
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
    ':currentPagePath': `/content/shred-it/${country}/${language}`,
    currentPagePath: window.location.pathname,
    jobPropertiesUrl: `https://main--shredit--stericycle.aem.page${form.dataset.action}.json`,
    formName: form.dataset?.action,
    formURL: window.location.href,
    webCountry: country === 'ca' ? country.toUpperCase() : country,
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
    // eCommerce flow: redirect to the external checkout instead of the lead-capture POST.
    // Falls through to the normal POST when disabled, off globally, or no URL resolves.
    const redirectUrl = await resolveEcommerceRedirectUrl(form);
    if (redirectUrl) {
      // eComm entry point: the form hands off to the external checkout, so eCommEntryPoint = 'Y'.
      sendDataToAnalytics(form, { eCommEntryPoint: 'Y' });
      // BR.410: fire the service-line entry-point event (Purge/ProtectPlus via the form flow;
      // resolveServiceLine returns the matching label). STERICMS-1027 / 1026. The helper no-ops
      // when serviceLine has no mapped event (e.g. ProtectPlus not enabled).
      const lead = collectLeadDataPoints(form);
      sendEcommEntryPointEvent({
        serviceLine: lead.serviceLine,
        eCommEntryPoint: 'Y',
        serviceAddress: lead.serviceAddress,
        zipCode: lead.zipCode,
        FN: lead.FN,
        LN: lead.LN,
        Email: lead.Email,
        Phone: lead.Phone,
      });
      window.location.assign(redirectUrl);
      return;
    }
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

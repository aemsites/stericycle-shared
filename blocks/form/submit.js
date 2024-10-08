import { DEFAULT_THANK_YOU_MESSAGE, getSubmitBaseUrl } from './constant.js';

// eslint-disable-next-line no-unused-vars
export function submitSuccess(e, form) {
  const { payload } = e;
  const redirectUrl = payload?.body?.redirectUrl;
  const thankYouMessage = payload?.body?.thankYouMessage;
  if (redirectUrl) {
    window.location.assign(encodeURI(redirectUrl));
  } else {
    let thankYouMsgEl = form.parentNode.querySelector('.form-message.success-message');
    if (!thankYouMsgEl) {
      thankYouMsgEl = document.createElement('div');
      thankYouMsgEl.className = 'form-message success-message';
    }
    thankYouMsgEl.innerHTML = thankYouMessage || DEFAULT_THANK_YOU_MESSAGE;
    form.parentNode.insertBefore(thankYouMsgEl, form);
    if (thankYouMsgEl.scrollIntoView) {
      thankYouMsgEl.scrollIntoView({ behavior: 'smooth' });
    }
    form.reset();
  }
  form.setAttribute('data-submitting', 'false');
  form.querySelector('button[type="submit"]').disabled = false;
}

// eslint-disable-next-line no-unused-vars
export function submitFailure(e, form) {
  let errorMessage = form.querySelector('.form-message.error-message');
  if (!errorMessage) {
    errorMessage = document.createElement('div');
    errorMessage.className = 'form-message error-message';
  }
  errorMessage.innerHTML = 'Some error occured while submitting the form'; // TODO: translation
  form.prepend(errorMessage);
  errorMessage.scrollIntoView({ behavior: 'smooth' });
  form.setAttribute('data-submitting', 'false');
  form.querySelector('button[type="submit"]').disabled = false;
}

// eslint-disable-next-line no-unused-vars
function generateUnique() {
  return new Date().valueOf() + Math.random();
}

function getFieldValue(fe, payload) {
  if (fe.type === 'radio') {
    return fe.form.elements[fe.name].value;
  } if (fe.type === 'checkbox') {
    if (fe.checked) {
      if (payload.get(fe.name)) {
        return `${payload.get(fe.name)},${fe.value}`;
      }
      return fe.value;
    }
  } else if (fe.type !== 'file') {
    return fe.value;
  }
  return null;
}

function constructPayload(form) {
  const formData = new FormData();
  [...form.elements].forEach((fe) => {
    if (fe.name && !fe.matches('button') && !fe.disabled && fe.tagName !== 'FIELDSET') {
      const value = getFieldValue(fe, formData);
      if (fe.closest('.repeat-wrapper')) {
        formData.append(fe.name, value);
      } else {
        formData.set(fe.name, value);
      }
    }
  });
  return formData;
}

async function prepareRequest(form) {
  const formData = constructPayload(form);
  const url = `${getSubmitBaseUrl()}${formData.get('xfpath')}.form`;
  return { formData, url };
}

export async function submitForm(form, captcha) {
  try {
    // eslint-disable-next-line prefer-const
    let { formData, url } = await prepareRequest(form, captcha);
    let token = null;
    if (captcha) {
      token = await captcha.getToken();
      formData.append('g-recaptcha-response', token);
      url += `?g-recaptcha-response=${encodeURIComponent(token)}`;
    }
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
        payload: response,
      }, form);
    }
  } catch (error) {
    submitFailure({
      payload: error,
    }, form);
  }
}

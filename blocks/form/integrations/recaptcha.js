export default class GoogleReCaptcha {
  id;

  siteKey;

  loadPromise;

  constructor(siteKey, id) {
    this.siteKey = siteKey;
    this.id = id;
  }

  async getToken() {
    if (!this.siteKey) {
      return null;
    }
    return new Promise((resolve) => {
      const { grecaptcha } = window;
      grecaptcha.ready(async () => {
        const token = await grecaptcha.execute(this.siteKey, { action: 'submit' });
        resolve(token);
      });
    });
  }
}

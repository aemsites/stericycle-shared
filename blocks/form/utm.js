const utmSources = 'https://www.google.com/,https://www.google.ca/,https://www.youtube.com/,https://www.bing.com/,https://www.yahoo.com/,https://duckduckgo.com/,https://www.startpage.com/,https://www.qwant.com/,https://swisscows.com/,https://www.searchencrypt.com/,https://www.onesearch.com/,https://www.givewater.com/,https://www.ekoru.org/,https://www.ecosia.org/,https://unsplash.com/,https://www.dogpile.com/,https://www.excite.com/,https://www.info.com/,https://www.metacrawler.com/,https://www.ask.com/,https://www.gigablast.com/,https://metager.org/,https://www.baidu.com/,https://www.lycos.com/,https://yandex.com/,https://archive.org/,https://www.wolframalpha.com/';

const createUtmInput = (name, value, form) => {
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value;
  form.appendChild(input);
};

export default function decorateUTM(form) {
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  utmParams.forEach((item) => {
    let utmValue = urlParams.get(item);
    const now = new Date();
    const minutes = 30;
    now.setTime(now.getTime() + (minutes * 60 * 1000));

    // Check if UTM value exists in URL or cookies
    if (utmValue != null && utmValue !== '') {
      createUtmInput(item, utmValue, form);
      document.cookie = `${item}=${utmValue}; path=/; expires=${now.toUTCString()}`;
    } else if (document.cookie.split('; ').find((row) => row.startsWith(`${item}=`))) {
      // eslint-disable-next-line prefer-destructuring
      utmValue = document.cookie.split('; ')
        .find((row) => row.startsWith(`${item}=`))
        .split('=')[1];
      createUtmInput(item, utmValue, form); // Create input dynamically using cookie value
    } else if (item === 'utm_medium' || item === 'utm_source') {
      // Check if utm_medium or utm_source can be determined from the referrer
      if (document.referrer) {
        const url = document.referrer.match(/:\/\/(.[^/]+)/)[1];
        if (utmSources.includes(url)) {
          utmValue = item === 'utm_medium' ? 'organic' : document.referrer;
          document.cookie = `${item}=${utmValue}; path=/; expires=${now.toUTCString()}`;
          createUtmInput(item, utmValue, form); // Create input dynamically from referrer
        }
      }
    }
  });
}

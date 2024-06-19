function isValidURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  if (block.children.length < 2) {
    return; // no content
  }

  const rows = [...block.children];
  [...rows[0].children].forEach((col, i) => {
    // setup image columns
    const pic = col.querySelector('picture');
    if (pic) {
      const picWrapper = pic.closest('div');
      if (picWrapper && picWrapper.children.length === 1) {
        // picture is only content in column
        picWrapper.classList.add('columns-img-col');
      }
    }

    // set onClick action
    const url = [...rows[1].children][i]?.textContent;
    if (url && isValidURL(url)) {
      // eslint-disable-next-line no-return-assign
      rows[0].children[i].onclick = () => window.location.href = url;
    }
    rows[1].remove();
  });
}

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
    let url = rows[1]?.children[i]?.querySelector('a')?.href;
    if (!url) {
      url = [...rows[1].children][i]?.textContent;
    }
    try {
      url = new URL(url);
      rows[0].children[i].onclick = () => {
        window.location.href = url.toString();
      };
    } catch (e) {
      // do nothing;
    }
    rows[1].remove();
  });
}

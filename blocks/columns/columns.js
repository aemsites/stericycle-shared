import { hr } from '../../scripts/dom-helpers.js';

export function applySplitPercentages(block) {
  const ratios = [];
  for (let i = 0; i < block.classList.length; i += 1) {
    const cls = block.classList[i];
    if (cls.startsWith('split-')) {
      const varName = `--${cls}`;
      const numbers = getComputedStyle(block).getPropertyValue(varName);
      numbers.split(':').forEach((n) => ratios.push(n));
      break;
    }
  }

  if (ratios.length === 0) {
    return;
  }

  let pctIdx = 0;

  for (let i = 0; i < block.children.length; i += 1) {
    if (block.children[i].localName === 'div') {
      for (let j = 0; j < block.children[i].children.length; j += 1) {
        if (block.children[i].children[j].localName === 'div') {
          block.children[i].children[j].style.flexBasis = ratios[pctIdx];
          pctIdx += 1;

          if (pctIdx >= ratios.length) {
            pctIdx = 0;
          }
        }
      }
    }
  }
}

function embedWistia(url) {
  let suffix = '';
  const suffixParams = {
    playerColor: '00857A',
  };

  suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  const temp = document.createElement('div');
  temp.innerHTML = `<div>
  <iframe allowtransparency="true" title="Wistia video player" allowFullscreen frameborder="0" scrolling="no" class="wistia_embed custom-shadow"
  name="wistia_embed" src="${url.href.endsWith('jsonp') ? url.href.replace('.jsonp', '') : url.href}${suffix}"></iframe>`;
  return temp.children.item(0);
}

function findEmbeds(block) {
  const wistia = block.querySelectorAll('a');

  wistia.forEach((link) => {
    if (link.href.startsWith('https://fast.wistia')) {
      const embedPosition = link.closest('div');
      embedPosition.replaceWith(embedWistia(link));
    }
  });
}

function applyHorizontalCellAlignment(block) {
  block.querySelectorAll(':scope div[data-align]').forEach((d) => {
    if (d.classList.contains('text-col')) {
      // This is a text column
      if (d.dataset.align) {
        d.style.textAlign = d.dataset.align;
      }
    } else {
      // This is an image column
      d.style.display = 'flex';
      d.style.flexDirection = 'column';
      d.style.alignItems = 'stretch';
      d.style.justifyContent = d.dataset.align;
    }
  });
}

// Vertical Cell Alignment is only applied to non-text columns
function applyVerticalCellAlignment(block) {
  block.querySelectorAll(':scope > div > div:not(.text-col-wrapper)').forEach((d) => {
    // this is an image column
    d.style.display = 'flex';
    d.style.flexDirection = 'column';
    d.style.alignItems = 'stretch';
    if (d.querySelector('p > strong')) {
      d.querySelector('p').classList.add('button-container');
      if (d.querySelector('p > strong > a')) {
        d.querySelector('p > strong > a').classList.add('button', 'primary');
      }
    }
  });
}

export function applyCellAlignment(block) {
  applyHorizontalCellAlignment(block);
  applyVerticalCellAlignment(block);
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);
  let isImageLink = false;
  if (block.querySelector('img')) {
    block.classList.add('columns-has-image');
  }

  if (block.classList.contains('divider')) {
    block.insertBefore(hr(), block.firstChild);
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      const link = col.querySelector('a');

      if (pic && link && link.href
        && new URL(link.href).pathname === new URL(link.innerText).pathname) {
        link.innerHTML = '';
        link.appendChild(pic);
        isImageLink = true;
      }

      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
      if (isImageLink) {
        block.classList.add('centered-text');
      }
    });
  });

  findEmbeds(block);
  applySplitPercentages(block);
  applyCellAlignment(block);
}

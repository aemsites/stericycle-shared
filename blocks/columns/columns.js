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
  block.querySelectorAll(':scope > div > div:not(.text-col-wrapper').forEach((d) => {
    // this is an image column
    d.style.display = 'flex';
    d.style.flexDirection = 'column';
    d.style.alignItems = 'stretch';
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

  applySplitPercentages(block);
  applyCellAlignment(block);
}

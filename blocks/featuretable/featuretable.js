/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

function buildCell(rowIndex) {
  const cell = rowIndex ? document.createElement('td') : document.createElement('th');
  if (!rowIndex) cell.setAttribute('scope', 'col');
  return cell;
}

function hasRowspan(table) {
  return [...table.querySelectorAll('td, th')].some((cell) => cell.rowSpan > 1);
}

export default async function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const header = !block.classList.contains('no-header');

  if (header) {
    table.append(thead);
  }
  table.append(tbody);

  let headerInfo; let colSpanRow; let colSpanCol; let
    colSpan;
  block.classList.forEach((el) => {
    if (el.startsWith('header')) {
      headerInfo = parseInt(el.split('-')[1], 10);
    }

    if (el.startsWith('colspan')) {
      const structure = el.split('-');
      colSpanRow = parseInt(structure[1], 10);
      colSpanCol = parseInt(structure[2], 10);
      colSpan = parseInt(structure[3], 10);
    }
  });

  let colLength;
  let symmetricalRow;
  const rowSpanMat = {};

  [...block.children].forEach((child, i, tableArr) => {
    const row = document.createElement('tr');
    if (header && headerInfo && i <= (headerInfo - 1)) {
      thead.append(row);
      colLength = tableArr[i].children.length;
    } else tbody.append(row);
    if (child.children.length < colLength) {
      if (Object.hasOwn(rowSpanMat, symmetricalRow)) {
        rowSpanMat[symmetricalRow] += 1;
      } else {
        rowSpanMat[symmetricalRow] = 2;
      }
    } else {
      symmetricalRow = i;
    }
    [...child.children].forEach((col) => {
      const cell = buildCell(header ? i : i + 1);
      cell.innerHTML = col.innerHTML;
      row.append(cell);
    });
  });

  if (colSpanRow && colSpan && colSpanCol) {
    const headerNthColumn = table.querySelector(`thead tr:first-child th:nth-child(${colSpanCol})`);

    // Set the colspan attribute to 3
    headerNthColumn.setAttribute('colspan', `${colSpan}`);
    headerNthColumn.setAttribute('rowspan', `${colSpanRow}`);
  }

  Object.entries(rowSpanMat).forEach(([k, v]) => {
    const bodyNthRow = table.querySelector(`tbody tr:nth-child(${k}) td:first-child`);

    bodyNthRow.setAttribute('rowspan', `${v}`);
  });

  block.innerHTML = '';
  block.append(table);

  const tableHasRowspan = hasRowspan(table);

  if (!tableHasRowspan) {
    block.classList.add('sticky-column');
  }
}

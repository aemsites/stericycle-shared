// Import DA's public crawl function
import { crawl } from 'https://da.live/nx/public/utils/tree.js';
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

// Helper function to update metadata value and return both states
function updateMetadataValue(dom, key, newValue, operation = 'modify') {
  const metadata = dom.querySelector('.metadata');
  if (!metadata) return { success: false };

  // Store the original state
  const beforeState = metadata.outerHTML;

  // Each row is a direct child div of .metadata
  const rows = metadata.children;
  
  if (operation === 'add') {
    // Check if key exists and update if it does
    for (const row of rows) {
      const [keyDiv, valueDiv] = row.children;
      const keyText = keyDiv?.textContent?.trim();
      
      if (keyText === key) {
        // Key exists, update the value
        if (valueDiv?.textContent) {
          valueDiv.textContent = newValue;
          return { 
            success: true, 
            before: beforeState,
            after: metadata.outerHTML,
            action: 'modified' // This will trigger the yellow highlight
          };
        }
      }
    }

    // Key doesn't exist, create new row
    const newRow = document.createElement('div');
    newRow.innerHTML = `
      <div><p>${key}</p></div>
      <div><p>${newValue}</p></div>
    `;
    metadata.appendChild(newRow);
    
    return {
      success: true,
      before: beforeState,
      after: metadata.outerHTML,
      action: 'added' // This will trigger the green highlight
    };
  }

  // For modify and delete operations
  for (const row of rows) {
    const [keyDiv, valueDiv] = row.children;
    const keyText = keyDiv?.textContent?.trim();
    
    if (keyText === key) {
      if (operation === 'delete') {
        row.remove();
        return {
          success: true,
          before: beforeState,
          after: metadata.outerHTML,
          action: 'deleted' // This will trigger the red highlight
        };
      } else { // modify
        if (valueDiv?.textContent) {
          valueDiv.textContent = newValue;
          return { 
            success: true, 
            before: beforeState,
            after: metadata.outerHTML,
            action: 'modified'
          };
        }
      }
    }
  }
  
  return { 
    success: false, 
    error: operation === 'delete' ? 'Key not found' : 'Invalid row structure'
  };
}

const createCallback = (key, newValue, isDryRun = false, operation = 'modify') => async (item) => {
  // Die if not a document
  if (!item.path.endsWith('.html')) return;

  const { token } = await DA_SDK;
  const opts = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const url = `https://admin.da.live/source${item.path}`;
  // Fetch the doc & convert to DOM
  const resp = await fetch(url, opts);
  if (!resp.ok) {
    console.log('Could not fetch item');
    return;
  }
  const text = await resp.text();
  const dom = new DOMParser().parseFromString(text, 'text/html');

  // Update the metadata value with the provided key and value
  const result = updateMetadataValue(dom, key, newValue, operation);
  
  if (!result.success) {
    console.log(`Could not update metadata for ${item.path}: ${result.error || 'Unknown error'}`);
    return;
  }

  if (!isDryRun) {
    const html = dom.body.outerHTML;
    const data = new Blob([html], { type: 'text/html' });

    const body = new FormData();
    body.append('data', data);

    const opts = { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body };
    const { status } = await fetch(url, opts);
    console.log(`Update HTTP status: ${status} - Path: ${item.path}`);
  }

  return {
    path: item.path,
    before: result.before,
    after: result.after,
    status: isDryRun ? 'dry-run' : `HTTP status: ${status}`,
    action: result.action
  };
}

async function executeUpdate(rootPath, key, value, isDryRun = false, operation = 'modify') {
  const results = [];
  const callback = createCallback(key, value, isDryRun, operation);
  
  const { results: crawlResults } = await crawl({
    path: rootPath,
    callback: async (item) => {
      try {
        const result = await callback(item);
        if (result) {
          results.push(result);
          return result;
        }
      } catch (error) {
        console.error(`Error processing ${item.path}:`, error);
      }
    },
    concurrent: 50
  });

  await crawlResults;
  return results;
}

// Dry run function that returns preview of changes
export async function dryRun(rootPath, key, value, operation = 'modify') {
  return executeUpdate(rootPath, key, value, true, operation);
}

// Crawl the tree of content and update files
export async function updateBlocks(rootPath, key, value, operation = 'modify') {
  console.log(`${operation} metadata: ${key}${operation !== 'delete' ? ` = ${value}` : ''}`);
  return executeUpdate(rootPath, key, value, false, operation);
}


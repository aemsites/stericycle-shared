/**
 * Node JS Script to Rename Folders with UTF-8 Encoded Characters
 * This script renames folders in a directory by decoding UTF-8 encoded characters in their names.
 * It recursively traverses the directory structure and renames folders that contain encoded characters.
 * The script uses Node.js's fs and path modules to read and rename directories.
 * It supports characters like á, é, í, ó, ú, and ñ.
 */
const fs = require('fs');
const path = require('path');

// Map of encoded UTF-8 sequences to their decoded characters
const replacements = {
  '%C3%A1': 'á',
  '%C3%A9': 'é',
  '%C3%AD': 'í',
  '%C3%B3': 'ó',
  '%C3%BA': 'ú',
  '%C3%B1': 'ñ',
};

// Recursively rename folders
function renameFoldersRecursively(dir) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const oldPath = path.join(dir, entry.name);
    let newName = entry.name;

    // Apply all replacements
    Object.entries(replacements).forEach(([encoded, decoded]) => {
      newName = newName.replace(new RegExp(encoded, 'g'), decoded);
    });

    const newPath = path.join(dir, newName);

    // Rename if name changed
    if (newName !== entry.name) {
      fs.renameSync(oldPath, newPath);
      // console.log(`Renamed: ${entry.name} → ${newName}`);
    }

    // Recurse into subdirectories
    if (entry.isDirectory()) {
      renameFoldersRecursively(newPath);
    }
  });
}

// 🔁 Start from your root folder
renameFoldersRecursively('D://downloads/fr-ca/centre-de-resources');
// bash
// node rename-folders.js
// You can change the path to the directory you want to start from
// For example, 'D://downloads/fr-ca/centre-de-resources' or any other directory
// Make sure to run this script in an environment where you have permission to rename folders
// and that the Node.js version supports the features used in this script.

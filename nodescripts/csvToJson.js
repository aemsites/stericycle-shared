/**
 * NodeJs script to Convert CSV to JSON
 * On a cmd line run:
 * node scripts/csvToJson.js
 * It will read the CSV file and write the JSON file in the same directory.
 * Make sure to update the csvFilePath and jsonFilePath variables as needed.
 */

const csv = require('csvtojson');
const fs = require('fs');

const csvFilePath = './../tools/importer/metadata/CA-EN-804.csv';
const jsonFilePath = './../tools/importer/metadata/ca-en-shredit-meta.json';

csv()
  .fromFile(csvFilePath)
  .then((jsonObj) => {
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObj, null, 2));
  });

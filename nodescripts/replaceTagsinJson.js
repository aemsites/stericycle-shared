const fs = require('fs');
/* eslint-disable quotes */

// Translation map (same as before)
const translations = {
  "Assessments": "Évaluation",
  "Infographics": "Infographie",
  "Videos": "Vidéos",
  "Newsletters": "Bulletin",
  "Press Releases": "Communiqués de presse",
  "Case Studies": "Études de cas",
  "Original Research": "Evaluation",
  "White Papers": "Livres blancs",
  "Info Sheets": "Fiches d’information",
  "Blogs": "Blogs (en anglais)",
  "Opinion Articles": "Articles d'opinion",
  "Topic": "Thématiques",
  "Data Security": "Sécurité des données",
  "Risk Management": "Gestion des risques",
  "Compliance & Legislation": "Conformité et législation",
  "Cybersecurity": "Cybersécurité",
  "Document Security Management": "Gestion de la sécurité des documents",
  "Employee Training": "Formation des collaborateurs",
  "Fraud & Identity Theft": "Fraude et usurpation d’identité",
  "Sustainability & Recycling": "Développement durable & Recyclage",
  "Shredding Best Practices": "Destruction sécurisée : bonnes pratiques",
  "Security Risks in the Office": "Événements de déchiquetage",
  "Shredding Events": "Événements de déchiquetage",
  "Hard Drive Destruction": "Destruction de disque dur",
  "Healthcare Security": "Sécurité des soins de santé",
  "Remote Work": "Télétravail / Travail à distance",
  "Breaches & Damage Control": "Brèches et maîtrise des dommages",
  "Corporate Information": "Information d'entreprise",
  "Workplace Security": "Sécurité du lieu de travail",
  "Information Security Management": "Gestion des documents",
};

// Load JSON
const rawData = fs.readFileSync('../tools/importer/metadata/fr-ca-shredit-meta.json', 'utf8');
const items = JSON.parse(rawData);

// Update Tags field
const updatedItems = items.map((entry) => {
  if (entry.Tags) {
    const translatedTags = entry.Tags.split(';').map((tag) => {
      const trimmed = tag.trim();
      return translations[trimmed] || trimmed;
    });
    entry.Tags = translatedTags.join(';');
  }
  return entry;
});

// Save updated JSON
fs.writeFileSync('../tools/importer/metadata/fr-ca-shredit-meta.json', JSON.stringify(updatedItems, null, 2), 'utf8');
console.log("✔️ Multi-tag translations applied and saved.");
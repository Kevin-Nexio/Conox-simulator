import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "src/main.jsx",
  "src/App.jsx",
  "src/styles/app.css",
  "src/data/index.js",
  "src/data/scenarios.js",
  "src/data/journey.js",
  "src/data/knowledge.js",
  "src/simulation/engine.js",
  "public/documents/CONOX_2D_Kontaktvorlage.oft",
  "public/documents/CONOX_2D_Produktbroschuere.pdf",
  "public/documents/CONOX_2D_Datenblatt.pdf",
];

const missing = requiredFiles.filter(
  (file) => !fs.existsSync(path.join(root, file)),
);

if (missing.length) {
  console.error(`Fehlende Projektdateien:\n${missing.join("\n")}`);
  process.exit(1);
}

const signatures = [
  ["public/documents/CONOX_2D_Produktbroschuere.pdf", "%PDF-"],
  ["public/documents/CONOX_2D_Datenblatt.pdf", "%PDF-"],
];

for (const [file, signature] of signatures) {
  const content = fs.readFileSync(path.join(root, file));
  if (!content.subarray(0, signature.length).equals(Buffer.from(signature))) {
    console.error(`Ungültige Dateisignatur: ${file}`);
    process.exit(1);
  }
}

console.log("Projektstruktur und Dokumente sind vollständig.");

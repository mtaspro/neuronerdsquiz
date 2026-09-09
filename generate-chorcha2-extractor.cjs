// Generates the root chorcha2-extractor.js bookmarklet from src/utils/chorcha2Script.js
// so both copies stay in sync. Run: node generate-chorcha2-extractor.cjs
const fs = require('fs');
const path = require('path');

const modulePath = path.join(__dirname, 'src', 'utils', 'chorcha2Script.js');
const outPath = path.join(__dirname, 'chorcha2-extractor.js');

const src = fs.readFileSync(modulePath, 'utf8');
const startMarker = 'String.raw`';
const start = src.indexOf(startMarker);
const end = src.lastIndexOf('`;');
if (start === -1 || end === -1 || end <= start) {
  console.error('Could not locate the script string in chorcha2Script.js');
  process.exit(1);
}
const script = src.slice(start + startMarker.length, end);

const header = [
  '// Chorcha Question Extractor (NEW Layout) - Bookmarklet Version',
  '// Works on the new Chorcha review page (question cards: div.relative.rounded-xl.border.p-5)',
  '// Extracts: question, options, correct answer (green #017A47 highlight),',
  '//           explanation (when unlocked) AND the exam reference tag (e.g. "DCU A 24-25").',
  '// Usage: paste this entire script in the browser console on the Chorcha review page,',
  '//        or save it as a bookmark URL. DO NOT EDIT HERE - edit src/utils/chorcha2Script.js',
  '//        and re-run: node generate-chorcha2-extractor.cjs',
  ''
].join('\n');

fs.writeFileSync(outPath, header + script + '\n');
console.log('Wrote', outPath, '(', script.length, 'chars of script )');

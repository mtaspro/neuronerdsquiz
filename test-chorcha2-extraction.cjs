// End-to-end test: run the chorcha2 extraction script against the real chorcha2.txt HTML via jsdom
const fs = require('fs');
const { JSDOM } = require('jsdom');

(async () => {
  const m = await import('./src/utils/chorcha2Script.js');
  let code = m.chorcha2Script.replace(/^javascript:/, '');
  // capture the extracted array instead of opening a popup
  code = code.replace('var questions = extractChorchaQuestions();', 'globalThis.__extracted = extractChorchaQuestions(); var questions = globalThis.__extracted;');
  const popupIdx = code.indexOf('var popup = window.open');
  if (popupIdx === -1) throw new Error('popup section not found');
  code = code.slice(0, popupIdx) + '})();';

  const html = fs.readFileSync('chorcha2.txt', 'utf8');
  const dom = new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>', { runScripts: 'outside-only' });
  dom.window.eval(code);

  const qs = dom.window.__extracted;
  console.log('Extracted questions:', qs.length);
  if (!qs.length) { console.error('FAIL: nothing extracted'); process.exit(1); }

  const assert = require('assert');
  for (const [i, q] of qs.entries()) {
    assert.ok(q.question && q.question.length > 5, `Q${i + 1} has question text`);
    assert.ok(Object.keys(q.options).length >= 2, `Q${i + 1} has >=2 options`);
    assert.ok(q.correctAnswer, `Q${i + 1} correct answer detected -> "${q.correctAnswer}"`);
    assert.ok(q.examReference, `Q${i + 1} exam reference detected -> "${q.examReference}"`);
    assert.ok(!/^[কখগঘ]$/.test(q.examReference), `Q${i + 1} exam ref is not an option letter`);
  }

  console.log('Sample Q1:', JSON.stringify(qs[0], null, 2).slice(0, 600));
  console.log('Sample Q2 (KaTeX):', JSON.stringify({ question: qs[1].question, correctAnswer: qs[1].correctAnswer, examReference: qs[1].examReference }));
  const refs = new Set(qs.map(q => q.examReference));
  console.log('Unique exam references:', [...refs]);
  console.log('EXTRACTION E2E TEST PASSED ✔');
})().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });

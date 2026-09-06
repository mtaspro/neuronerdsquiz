// Test harness: run sattacademy-extractor.js logic against sattacademydom.html
const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(__dirname + '/sattacademydom.html', 'utf8');
const dom = new JSDOM(html);
const { document } = dom.window;

let code = fs.readFileSync(__dirname + '/sattacademy-extractor.js', 'utf8');
code = code
  .replace('(function () {', '')
  .replace(/console\.log\('Extracted[\s\S]*$/, '');

global.document = document;
const fn = new Function('document', 'console', code + '; return { questions: extractSattaQuestions() };');
const { questions } = fn(document, console);

// Cross-check correct answers against the hidden answer inputs
const hiddenAnswers = [...document.querySelectorAll('.test-mode-data input[name="answer"]')].map(i => i.value);
console.log('Hidden answer values:', hiddenAnswers.join(','));

let pass = 0, fail = 0;

questions.forEach(function (q, i) {
    const optsOk = q.options.length === 4 && q.options.every(o => /^[কখগঘ]\. /.test(o));
    const corrOk = !!q.correctAnswer && q.options.some(o => o.slice(3) === q.correctAnswer);
    let matchedHidden = false;
    const hiddenVal = hiddenAnswers[i];
    if (hiddenVal !== undefined) {
        const idx = parseInt(hiddenVal, 10) - 1;
        matchedHidden = q.options[idx] && q.options[idx].slice(3) === q.correctAnswer;
    }
    if (optsOk && corrOk && matchedHidden) { pass++; }
    else {
        fail++;
        console.log('FAIL Q' + (i + 1), JSON.stringify(q));
    }
});

console.log('\n' + pass + '/' + questions.length + ' questions passed');
if (questions.length !== 15) { console.log('FAIL: expected 15 questions, got ' + questions.length); process.exit(1); }
process.exit(fail ? 1 : 0);

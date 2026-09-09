// Functional test for the /parse-bulk-questions logic (mirrors routes/admin.js parser)
// Verifies the new "Exam Reference:" line is parsed into examReference.

const bulkText = [
  '1. 16Ω রোধের একটি তারকে সমান 4 টি খন্ডে বিভক্ত করে এদেরকে সমান্তরাল সমবায়ে সংযোগ করা হলো। তুল্য রোধ কত হবে?',
  'ক. 4Ω',
  'খ. 64Ω',
  'গ. 16Ω',
  'ঘ. 1Ω',
  'Correct Answer: 1Ω',
  'Explanation: ',
  'Exam Reference: DCU A 24-25',
  '',
  '---',
  '',
  '2. শূন্য ভর ও $E$ শক্তিবিশিষ্ট একটি কণার ভরবেগ কোনটি?',
  'ক. 0',
  'খ. $\\sqrt{E}c$',
  'গ. $\\frac{E}{c}$',
  'ঘ. $Ec$',
  'Correct Answer: $\\frac{E}{c}$',
  'Explanation: ভরবেগ p = E/c হয় শূন্য ভরের কণার ক্ষেত্রে।',
  'Exam Reference: DCU A 24-25',
  '',
  '---',
  '',
  '3. Legacy question without exam reference',
  'ক. a',
  'খ. b',
  'গ. c',
  'ঘ. d',
  'Correct Answer: b',
  'Explanation: none'
].join('\n');

// ---- BEGIN: exact copy of the parser logic from routes/admin.js ----
const questions = [];
const questionBlocks = bulkText.split(/\n\s*---\s*\n/).filter(block => block.trim());

for (const block of questionBlocks) {
  const lines = block.split('\n').map(line => line.trim()).filter(line => line);

  let question = '';
  const options = [];
  let correctAnswer = '';
  let explanation = '';
  let examReference = '';

  let currentSection = 'question';

  for (const line of lines) {
    if (line.match(/^[কখগঘA-Da-d][\.\)]/)) {
      currentSection = 'options';
      const optionText = line.replace(/^[কখগঘA-Da-d][\.\)]\s*/, '').trim();
      options.push(optionText);
    } else if (line.startsWith('Correct Answer:')) {
      correctAnswer = line.replace('Correct Answer:', '').trim();
      currentSection = 'answer';
    } else if (line.startsWith('Explanation:')) {
      explanation = line.replace('Explanation:', '').trim();
      currentSection = 'explanation';
    } else if (/^Exam Reference:/i.test(line)) {
      examReference = line.replace(/^Exam Reference:/i, '').trim();
      currentSection = 'examReference';
    } else if (currentSection === 'question') {
      question += (question ? ' ' : '') + line;
    } else if (currentSection === 'explanation') {
      explanation += (explanation ? ' ' : '') + line;
    }
  }

  let cleanQuestion = question.trim().replace(/^(?:Q\d+[\.\:\s]+|\d+[\.\:\s]+|[০-৯]+[\.\:\s]+)+/i, '').trim();
  if (!cleanQuestion) cleanQuestion = question.trim();

  let cleanAnswer = correctAnswer.trim();
  const prefixMatch = cleanAnswer.match(/^[কখগঘA-Da-d][\.\)]\s*(.+)$/);
  if (prefixMatch && prefixMatch[1]) {
    cleanAnswer = prefixMatch[1].trim();
  } else {
    const letterMap = { 'ক': 0, 'খ': 1, 'গ': 2, 'ঘ': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    if (letterMap[cleanAnswer] !== undefined && options[letterMap[cleanAnswer]]) {
      cleanAnswer = options[letterMap[cleanAnswer]];
    }
  }

  const matchingOpt = options.find(opt =>
    opt.trim() === cleanAnswer ||
    opt.replace(/\$/g, '').trim() === cleanAnswer.replace(/\$/g, '').trim()
  );
  if (matchingOpt) {
    cleanAnswer = matchingOpt;
  }

  if (cleanQuestion && options.length >= 2) {
    questions.push({
      question: cleanQuestion,
      options: options,
      correctAnswer: cleanAnswer,
      explanation: explanation,
      examReference: examReference && examReference !== '(none)' ? examReference : ''
    });
  }
}
// ---- END: parser logic copy ----

const assert = require('assert');

assert.strictEqual(questions.length, 3, 'should parse 3 questions');
assert.strictEqual(questions[0].examReference, 'DCU A 24-25', 'q1 examReference');
assert.strictEqual(questions[0].correctAnswer, '1Ω', 'q1 correct answer');
assert.strictEqual(questions[0].question.startsWith('16Ω রোধের'), true, 'q1 numbering stripped');
assert.strictEqual(questions[1].examReference, 'DCU A 24-25', 'q2 examReference');
assert.strictEqual(questions[1].correctAnswer, '$\\frac{E}{c}$', 'q2 math-tolerant answer match');
assert.ok(questions[1].explanation.includes('p = E/c'), 'q2 explanation intact');
assert.strictEqual(questions[2].examReference, '', 'q3 no reference -> empty');

console.log('PARSER TEST PASSED ✔');
questions.forEach((q, i) => console.log(`Q${i + 1}:`, JSON.stringify({ question: q.question.slice(0, 40) + '...', correctAnswer: q.correctAnswer, examReference: q.examReference })));

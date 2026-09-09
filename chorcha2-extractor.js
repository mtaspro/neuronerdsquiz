// Chorcha Question Extractor (NEW Layout) - Bookmarklet Version
// Works on the new Chorcha review page (question cards: div.relative.rounded-xl.border.p-5)
// Extracts: question, options, correct answer (green #017A47 highlight),
//           explanation (when unlocked) AND the exam reference tag (e.g. "DCU A 24-25").
// Usage: paste this entire script in the browser console on the Chorcha review page,
//        or save it as a bookmark URL. DO NOT EDIT HERE - edit src/utils/chorcha2Script.js
//        and re-run: node generate-chorcha2-extractor.cjs
javascript:(function () {
    function extractMathText(node) {
        if (!node) return '';
        var clone = node.cloneNode(true);

        // 1. KaTeX containers -> $tex$ (from the annotation)
        var katexList = clone.querySelectorAll('.katex');
        katexList.forEach(function (kEl) {
            var annotation = kEl.querySelector('annotation');
            var tex = annotation && annotation.textContent ? annotation.textContent.trim() : '';
            if (tex) {
                kEl.replaceWith(document.createTextNode(' $' + tex + '$ '));
            } else {
                kEl.remove();
            }
        });

        // 2. MathJax containers -> $tex$
        var mjxList = clone.querySelectorAll('mjx-container');
        mjxList.forEach(function (mEl) {
            var annotation = mEl.querySelector('annotation');
            var tex = annotation && annotation.textContent ? annotation.textContent.trim() : '';
            if (tex) {
                mEl.replaceWith(document.createTextNode(' $' + tex + '$ '));
            } else {
                mEl.remove();
            }
        });

        // 3. Raw MathML <math> tags -> $tex$
        var mathTags = clone.querySelectorAll('math');
        mathTags.forEach(function (mTag) {
            var annotation = mTag.querySelector('annotation');
            if (annotation && annotation.textContent) {
                var tex = annotation.textContent.replace(/^\$+|\$+$/g, '').trim();
                mTag.replaceWith(document.createTextNode(' $' + tex + '$ '));
            } else {
                mTag.remove();
            }
        });

        // 4. Preserve line breaks
        var brs = clone.querySelectorAll('br');
        brs.forEach(function (br) { br.replaceWith(document.createTextNode('\n')); });

        var text = clone.textContent || '';
        return text
            .replace(/\u00a0/g, ' ')
            .split('\n')
            .map(function (l) { return l.replace(/[ \t]+/g, ' ').trim(); })
            .filter(Boolean)
            .join('\n')
            .trim();
    }

    // The exam reference tag: <span class="cursor-pointer tag tag-cyan ...">DCU A 24-25 </span>
    function extractExamReference(card) {
        var refSpan = card.querySelector('span[class*="tag-cyan"]') ||
                      card.querySelector('span[class*="tag-"]');
        var ref = refSpan ? refSpan.textContent.replace(/\s+/g, ' ').trim() : '';
        // Ignore accidental matches like a single option letter (ক / A ...)
        if (/^[কখগঘA-Da-d]$/.test(ref)) return '';
        return ref;
    }
    function extractChorchaQuestions() {
        var questions = [];
        console.log('Extracting Chorcha questions (new layout, with exam references)...');

        var questionCards = document.querySelectorAll('div.relative.rounded-xl.border.p-5');
        if (!questionCards.length) {
            questionCards = document.querySelectorAll('div[class*="rounded-xl"][class*="border"][class*="p-5"]');
        }
        console.log('Found ' + questionCards.length + ' question cards');

        questionCards.forEach(function (card, index) {
            try {
                // --- Question text ---
                var questionWrapper = card.querySelector('.text-card-foreground');
                if (!questionWrapper) return;

                var questionText = extractMathText(questionWrapper);
                if (!questionText) return;

                // Strip leading numbering like "5. ", "Q5. ", "৫. "
                questionText = questionText.replace(/^(?:Q?\d+|[০-৯]+)[\.\:\)]\s*/i, '').trim();
                if (!questionText) return;

                // --- Exam reference (e.g. DCU A 24-25) ---
                var examReference = extractExamReference(card);

                // --- Options ---
                var optionButtons = card.querySelectorAll('.grid button');
                if (!optionButtons.length) {
                    optionButtons = card.querySelectorAll('div[class*="grid-cols"] button');
                }
                if (!optionButtons.length) return;

                var options = {};
                var correctAnswer = '';
                var defaultLetters = ['ক', 'খ', 'গ', 'ঘ'];

                optionButtons.forEach(function (button, btnIdx) {
                    var letterSpan = button.querySelector('span');
                    var optionWrapper = button.querySelector('.flex-1') || button;

                    var letter = letterSpan ? letterSpan.textContent.trim() : (defaultLetters[btnIdx] || ('Option ' + (btnIdx + 1)));
                    letter = letter.replace(/[\.\)]/g, '').trim();

                    var optionText = extractMathText(optionWrapper);
                    optionText = optionText.replace(/^[কখগঘA-Da-d][\.\)]\s*/, '').trim();
                    if (!optionText) return;

                    options[letter] = optionText;

                    // Correct option is highlighted green on this layout:
                    // bg-[#017A471A] / border-[#017A47] (also keep legacy color checks)
                    var btnClass = (button.className || '').toLowerCase();
                    var spanClass = letterSpan ? (letterSpan.className || '').toLowerCase() : '';
                    var isCorrect =
                        btnClass.indexOf('017a47') !== -1 || spanClass.indexOf('017a47') !== -1 ||
                        btnClass.indexOf('f59e0b') !== -1 || spanClass.indexOf('f59e0b') !== -1 ||
                        btnClass.indexOf('amber') !== -1 || spanClass.indexOf('amber') !== -1 ||
                        btnClass.indexOf('emerald') !== -1 || spanClass.indexOf('emerald') !== -1 ||
                        btnClass.indexOf('10b981') !== -1 || btnClass.indexOf('22c55e') !== -1 ||
                        button.querySelector('svg[class*="amber"], svg[class*="green"], svg[class*="emerald"]') !== null;

                    if (isCorrect) {
                        correctAnswer = optionText;
                    }
                });

                // --- Explanation (only when unlocked; locked cards show an /upgrade link) ---
                var explanation = '';
                var explSection = card.querySelector('section');
                if (explSection && !explSection.querySelector('a[href*="upgrade"]')) {
                    explanation = extractMathText(explSection);
                }

                if (questionText && Object.keys(options).length >= 2) {
                    questions.push({
                        question: questionText,
                        options: options,
                        correctAnswer: correctAnswer,
                        explanation: explanation,
                        examReference: examReference
                    });
                }
            } catch (err) {
                console.log('Error processing question ' + (index + 1) + ':', err);
            }
        });

        return questions;
    }
    var questions = extractChorchaQuestions();

    var formattedText = questions.map(function (q, idx) {
        var optionsText = Object.entries(q.options)
            .map(function (entry) { return entry[0] + '. ' + entry[1]; })
            .join('\n');

        return (idx + 1) + '. ' + q.question + '\n' + optionsText +
               '\nCorrect Answer: ' + (q.correctAnswer || '(not detected)') +
               '\nExplanation: ' + (q.explanation || '') +
               '\nExam Reference: ' + (q.examReference || '(none)');
    }).join('\n\n---\n\n');

    var popup = window.open('', '_blank', 'width=920,height=750,scrollbars=yes');
    if (popup) {
        var escaped = formattedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        popup.document.write(
            '<!DOCTYPE html><html><head><title>Extracted Questions (' + questions.length + ') with Exam References</title>' +
            '<meta charset="utf-8">' +
            '<style>' +
            'body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; background: #0f172a; color: #f8fafc; }' +
            'h2 { color: #38bdf8; margin-bottom: 8px; }' +
            '.subtitle { color: #94a3b8; margin-bottom: 20px; font-size: 14px; }' +
            '.btn { background: #0284c7; color: white; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; }' +
            '.btn:hover { background: #0369a1; }' +
            '.btn-success { background: #16a34a; }' +
            'pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; white-space: pre-wrap; word-break: break-word; max-height: 70vh; overflow-y: auto; }' +
            '</style></head><body>' +
            '<h2>🚀 Extracted ' + questions.length + ' Questions (with LaTeX + Exam References)</h2>' +
            '<p class="subtitle">Formulas converted to $...$ notation. Exam reference tags (e.g. DCU A 24-25) are extracted per question.</p>' +
            '<div style="margin-bottom: 16px;"><button class="btn" id="copyBtn">📋 Copy All Questions</button></div>' +
            '<pre id="questions">' + escaped + '</pre>' +
            '<scr' + 'ipt>' +
            'var copyBtn = document.getElementById("copyBtn");' +
            'copyBtn.addEventListener("click", function () {' +
            '  var text = document.getElementById("questions").textContent;' +
            '  var done = function () { copyBtn.innerText = "✓ Copied!"; copyBtn.className = "btn btn-success"; };' +
            '  var fallback = function () {' +
            '    var ta = document.createElement("textarea");' +
            '    ta.value = text;' +
            '    document.body.appendChild(ta);' +
            '    ta.select();' +
            '    document.execCommand("copy");' +
            '    ta.remove();' +
            '    done();' +
            '  };' +
            '  if (navigator.clipboard && navigator.clipboard.writeText) {' +
            '    navigator.clipboard.writeText(text).then(done).catch(fallback);' +
            '  } else { fallback(); }' +
            '  setTimeout(function () { copyBtn.innerText = "📋 Copy All Questions"; copyBtn.className = "btn"; }, 2500);' +
            '});' +
            '</scr' + 'ipt>' +
            '</body></html>'
        );
        popup.document.close();
    } else {
        alert('Popup blocked! Please allow popups or check console for extracted questions.');
        console.log(formattedText);
    }
})();

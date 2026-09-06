// Sattacademy Question Extractor — paste in DevTools Console on a
// sattacademy.com question-bank page (e.g. /ques-bank/dcu/mcq?page=N)
(function () {
    function extractMathText(node) {
        if (!node) return '';
        var clone = node.cloneNode(true);

        // 1. KaTeX containers -> $...$ / $$...$$
        clone.querySelectorAll('.katex').forEach(function (kEl) {
            var tex = '';
            var annotation = kEl.querySelector('annotation');
            if (annotation && annotation.textContent) {
                tex = annotation.textContent.trim();
            } else {
                var mathml = kEl.querySelector('.katex-mathml');
                if (mathml && mathml.textContent) tex = mathml.textContent.trim();
            }
            if (tex) {
                tex = tex.replace(/^\$+|\$+$/g, '').trim();
                var isDisplay = kEl.classList.contains('katex-display') || kEl.closest('.katex-display') !== null;
                var delimiter = isDisplay ? '$$' : '$';
                kEl.replaceWith(document.createTextNode(' ' + delimiter + tex + delimiter + ' '));
            } else {
                var kHtml = kEl.querySelector('.katex-html');
                if (kHtml) kHtml.remove();
            }
        });

        // 2. MathJax v3 / v2
        clone.querySelectorAll('mjx-container, .MathJax, [class*="MathJax"]').forEach(function (mEl) {
            var tex = mEl.getAttribute('aria-label') || mEl.getAttribute('alt') || '';
            if (!tex) {
                var annotation = mEl.querySelector('annotation');
                if (annotation) tex = annotation.textContent;
            }
            if (!tex) {
                var scriptTag = mEl.querySelector('script[type*="math/tex"]');
                if (scriptTag) tex = scriptTag.textContent;
            }
            if (tex) {
                tex = tex.replace(/^\$+|\$+$/g, '').trim();
                var isDisplay = mEl.hasAttribute('display');
                var delimiter = isDisplay ? '$$' : '$';
                mEl.replaceWith(document.createTextNode(' ' + delimiter + tex + delimiter + ' '));
            }
        });

        // 3. Raw <math> tags
        clone.querySelectorAll('math').forEach(function (mTag) {
            var annotation = mTag.querySelector('annotation');
            if (annotation && annotation.textContent) {
                var tex = annotation.textContent.replace(/^\$+|\$+$/g, '').trim();
                mTag.replaceWith(document.createTextNode(' $' + tex + '$ '));
            }
        });

        // 4. Preserve line breaks
        clone.querySelectorAll('br').forEach(function (br) { br.replaceWith(document.createTextNode('\n')); });

        var text = clone.textContent || '';
        return text
            .replace(/\u00a0/g, ' ')
            .split('\n')
            .map(function (l) { return l.replace(/[ \t]+/g, ' ').trim(); })
            .filter(Boolean)
            .join('\n')
            .trim();
    }

    function extractSattaQuestions() {
        var questions = [];
        console.log('Extracting Sattacademy questions...');

        // Each question is a card
        var cards = document.querySelectorAll('#question-list div.card.card-bordered');
        if (!cards.length) {
            cards = document.querySelectorAll('div.card.card-bordered');
        }
        console.log('Found', cards.length, 'question cards');

        cards.forEach(function (card, index) {
            try {
                // --- Question text ---
                var questionSpan = card.querySelector('.question-span');
                if (!questionSpan) return;
                var questionText = extractMathText(questionSpan);
                if (!questionText) return;

                // Strip leading numbering "1. ", "Q5. ", "৫. "
                questionText = questionText.replace(/^(?:Q?\d+|[০-৯]+)[\.:\)]\s*/i, '').trim();

                // --- Correct answer index (deterministic: hidden input) ---
                var answerIndex = null;
                var hiddenAnswer = card.querySelector('input[type="hidden"][name="answer"]');
                if (hiddenAnswer && hiddenAnswer.value) {
                    answerIndex = parseInt(hiddenAnswer.value, 10);
                }

                // --- Options from reading-mode-data ---
                var readingMode = card.querySelector('.reading-mode-data');
                if (!readingMode) return;
                var optionDivs = readingMode.querySelectorAll('.row > div.col-md-6');
                if (!optionDivs.length) return;

                var letters = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];
                var options = [];
                var correctAnswer = '';

                optionDivs.forEach(function (optDiv, optIdx) {
                    var label = optDiv.querySelector('label') || optDiv.querySelector('.overflow-auto');
                    if (!label) return;
                    var optionText = extractMathText(label);
                    if (!optionText) return;

                    var letter = letters[optIdx] || ('Option ' + (optIdx + 1));
                    options.push(letter + '. ' + optionText);

                    // Fallback: blue tick icon marks the correct answer
                    if (answerIndex === null && optDiv.querySelector('.sa-success, .fa-check-circle')) {
                        answerIndex = optIdx + 1;
                    }
                    if (answerIndex === optIdx + 1) {
                        correctAnswer = optionText;
                    }
                });

                if (!correctAnswer) {
                    console.log('Warning: no correct answer detected for question', index + 1);
                }

                if (questionText && options.length >= 2) {
                    questions.push({
                        question: questionText,
                        options: options,
                        correctAnswer: correctAnswer,
                        explanation: '' // Sattacademy explanations load separately via "Des" button
                    });
                }
            } catch (err) {
                console.log('Error processing question ' + (index + 1) + ':', err);
            }
        });

        return questions;
    }



    var questions = extractSattaQuestions();

    var formattedText = questions.map(function (q, idx) {
        return (idx + 1) + '. ' + q.question + '\n' +
            q.options.join('\n') +
            '\nCorrect Answer: ' + (q.correctAnswer || '(not detected)') +
            '\nExplanation: ' + (q.explanation || '');
    }).join('\n\n---\n\n');

    console.log('Extracted ' + questions.length + ' questions.');
    console.log(formattedText);

    try {
        navigator.clipboard.writeText(formattedText).then(function () {
            alert('✅ Extracted ' + questions.length + ' questions and copied to clipboard! Paste into HSCAura bulk import.');
        }).catch(function () {
            var popup = window.open('', '_blank', 'width=920,height=750,scrollbars=yes');
            if (popup) {
                var escaped = formattedText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                popup.document.write('<!DOCTYPE html><html><head><title>Extracted Questions (' + questions.length + ')</title><meta charset="utf-8">' +
                    '<style>body{font-family:system-ui,sans-serif;padding:24px;background:#0f172a;color:#f8fafc}h2{color:#38bdf8}' +
                    '.btn{background:#0284c7;color:white;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:600}' +
                    '.btn:hover{background:#0369a1}.btn-success{background:#16a34a}' +
                    'pre{background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.6;max-height:550px;overflow-y:auto}</style></head><body>' +
                    '<h2>🚀 Extracted ' + questions.length + ' Questions</h2>' +
                    '<div style="margin-bottom:16px">' +
                    '<button class="btn" id="copyBtn" onclick="var t=document.getElementById(\'questions\').textContent; var b=this; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.innerText=\'✓ Copied!\';b.className=\'btn btn-success\';}).catch(function(){var ta=document.createElement(\'textarea\');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand(\'copy\');ta.remove();b.innerText=\'✓ Copied!\';b.className=\'btn btn-success\';}); setTimeout(function(){b.innerText=\'📋 Copy All Questions\';b.className=\'btn\';},2500);">📋 Copy All Questions</button>' +
                    '</div>' +
                    '<pre id="questions">' + escaped + '</pre></body></html>');
                popup.document.close();
            } else {
                alert('Clipboard blocked and popup blocked! Check the browser console — the text is logged there.');
            }
        });
    } catch (e) {
        console.log(formattedText);
        alert('Could not access clipboard — the extracted text is in the console. Copy it from there.');
    }
})();

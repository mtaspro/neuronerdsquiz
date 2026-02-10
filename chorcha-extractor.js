// Chorcha Question Extractor - Bookmarklet Version
// Copy this entire code and create a bookmark with it as the URL

javascript:(function () {
    function extractChorchaQuestions() {
        const questions = [];
        console.log('Starting extraction (new layout)...');

        // Each question card
        const questionCards = document.querySelectorAll(
            'div.space-y-4 > div > div.w-full > div.border.rounded-xl'
        );

        questionCards.forEach((card, index) => {
            try {
                if (index % 10 === 0) console.log(`Processing question ${index + 1}...`);

                // --- Question text ---
                const questionTextWrapper = card.querySelector(
                    '.text-card-foreground .px-1'
                );
                if (!questionTextWrapper) return;

                // Join all <p> elements inside as one question (with line breaks)
                const questionParts = Array.from(
                    questionTextWrapper.querySelectorAll('p')
                ).map(p => p.textContent.trim()).filter(Boolean);

                const questionText = questionParts.join('\n');
                if (!questionText) return;

                // --- Options ---
                const optionButtons = card.querySelectorAll(
                    '.grid.md\\:grid-cols-2.grid-cols-1.gap-2 button'
                );
                if (!optionButtons.length) return;

                const options = {};
                let correctAnswer = '';

                optionButtons.forEach(button => {
                    const letterSpan = button.querySelector('span');
                    const optionTextWrapper = button.querySelector('.flex-1 .px-1');

                    if (!letterSpan || !optionTextWrapper) return;

                    const letter = letterSpan.textContent.trim();
                    const optionText = optionTextWrapper.textContent.trim();

                    if (!letter || !optionText) return;

                    options[letter] = optionText;

                    // Detect correct option:
                    // Correct one has orange-ish classes like bg-[#F59E0B1F], border-[#F59E0B]
                    const btnClass = button.className || '';
                    const spanClass = letterSpan.className || '';

                    const isCorrect =
                        btnClass.includes('F59E0B') ||
                        spanClass.includes('F59E0B');

                    if (isCorrect) {
                        correctAnswer = optionText;
                    }
                });

                // --- Explanation ---
                let explanation = '';
                const explanationContainer = card.querySelector('.card-bekkha');
                if (explanationContainer) {
                    explanation = explanationContainer.textContent
                        .replace(/\s+\n/g, '\n')
                        .replace(/\n\s+/g, '\n')
                        .trim();
                }

                if (questionText && Object.keys(options).length >= 2) {
                    questions.push({
                        question: questionText,
                        options,
                        correctAnswer,
                        explanation
                    });
                }
            } catch (err) {
                console.log(`Error processing question ${index + 1}:`, err);
            }
        });

        return questions;
    }

    const questions = extractChorchaQuestions();

    const formattedText = questions.map((q, idx) => {
        const optionsText = Object.entries(q.options)
            .map(([letter, text]) => `${letter}. ${text}`)
            .join('\n');

        return `Q${idx + 1}. ${q.question}\n${optionsText}\nCorrect Answer: ${q.correctAnswer || '(not detected)'}\nExplanation: ${q.explanation || ''}`;
    }).join('\n\n---\n\n');

    const popup = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    popup.document.write(`
        <html>
        <head><title>Extracted Questions (${questions.length})</title></head>
        <body style="font-family: Arial; padding: 20px;">
            <h2>Extracted ${questions.length} Questions</h2>
            <button onclick="navigator.clipboard.writeText(document.getElementById('questions').textContent); alert('Copied!');"
                    style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px;">
                Copy All Questions
            </button>
            <pre id="questions" style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${formattedText}</pre>
        </body>
        </html>
    `);
})();